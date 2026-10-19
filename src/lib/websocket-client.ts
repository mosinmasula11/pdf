export type SocketState = "disconnected" | "connecting" | "connected" | "error";
export type SocketEventKind = "sent" | "received" | "system" | "error";
export interface SocketLogEntry { id: number; kind: SocketEventKind; text: string; timestamp: number; bytes: number; binary?: boolean; truncated?: boolean }
export interface SocketProfile { id: string; name: string; url: string }
export const SOCKET_MESSAGE_LIMIT = 2 * 1024 * 1024;
export const SOCKET_LOG_LIMIT = 200;
const PREVIEW_LIMIT = 64 * 1024;

export function parseSocketUrl(value: string, pageProtocol = "http:") {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Enter a complete ws:// or wss:// URL."); }
  if (!["ws:", "wss:"].includes(url.protocol)) throw new Error("Use ws:// or wss:// for a WebSocket connection.");
  if (url.username || url.password) throw new Error("Embedded usernames and passwords are not supported.");
  if (url.hash) throw new Error("WebSocket URLs cannot contain a fragment (#).");
  if (pageProtocol === "https:" && url.protocol !== "wss:") throw new Error("This HTTPS page requires a secure wss:// connection.");
  return url.toString();
}

export function parseSocketProtocols(value: string) {
  if (!value.trim()) return [];
  const protocols = value.split(",").map(item => item.trim());
  if (protocols.some(item => !/^[!#$%&'*+\-.^_\x60|~0-9A-Za-z]+$/.test(item))) throw new Error("Subprotocols must be comma-separated protocol names without spaces.");
  if (new Set(protocols).size !== protocols.length) throw new Error("Subprotocol names must be unique.");
  return protocols;
}

export function sanitizeSocketProfile(profile: SocketProfile): SocketProfile {
  const url = new URL(parseSocketUrl(profile.url));
  // Query names may be arbitrary, so never persist any query values.
  for (const key of [...url.searchParams.keys()]) url.searchParams.set(key, "");
  return { id: profile.id, name: profile.name.trim().slice(0, 80), url: url.toString() };
}

export function loadSocketProfiles(value: unknown): SocketProfile[] {
  if (!Array.isArray(value)) return [];
  const result: SocketProfile[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item.id !== "string" || typeof item.name !== "string" || !item.name.trim() || typeof item.url !== "string" || seen.has(item.id)) continue;
    try { result.push(sanitizeSocketProfile(item)); seen.add(item.id); } catch { /* Skip malformed browser drafts. */ }
    if (result.length === 25) break;
  }
  return result;
}

export function appendSocketLog(entries: SocketLogEntry[], entry: SocketLogEntry) {
  const next = [...entries, entry].slice(-SOCKET_LOG_LIMIT);
  let bytes = next.reduce((sum, item) => sum + item.text.length * 2, 0);
  while (bytes > SOCKET_MESSAGE_LIMIT && next.length > 1) bytes -= next.shift()!.text.length * 2;
  return next;
}

interface SocketCallbacks {
  onState: (state: SocketState) => void;
  onEvent: (entry: SocketLogEntry) => void;
  createSocket?: (url: string, protocols: string[]) => WebSocket;
  timeoutMs?: number;
}

// The platform WebSocket handles framing, TLS and handshakes. This only manages UI lifecycle.
export class SocketSession {
  private socket: WebSocket | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private detach: (() => void) | null = null;
  private sequence = 0;
  constructor(private callbacks: SocketCallbacks) {}

  private emit(kind: SocketEventKind, text: string, bytes = 0, binary = false) {
    this.callbacks.onEvent({ id: ++this.sequence, kind, text: text.slice(0, PREVIEW_LIMIT), bytes, binary,
      truncated: text.length > PREVIEW_LIMIT, timestamp: Date.now() });
  }
  private clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = null; }
  private release(socket: WebSocket) {
    if (this.socket !== socket) return;
    this.clearTimer(); this.detach?.(); this.detach = null; this.socket = null;
  }

  connect(value: string, protocolText: string, pageProtocol = "http:", createSocket?: (url: string, protocols: string[]) => WebSocket) {
    if (this.socket) throw new Error("Disconnect the current WebSocket before connecting again.");
    const url = parseSocketUrl(value, pageProtocol), protocols = parseSocketProtocols(protocolText);
    const factory = createSocket || this.callbacks.createSocket;
    const socket = factory ? factory(url, protocols) : new WebSocket(url, protocols);
    this.socket = socket; socket.binaryType = "arraybuffer";
    const active = () => this.socket === socket;
    const open = () => {
      if (!active()) return;
      this.clearTimer(); this.callbacks.onState("connected");
      this.emit("system", "Connected" + (socket.protocol ? " | Subprotocol: " + socket.protocol : ""));
    };
    const message = (event: MessageEvent) => {
      if (!active()) return;
      const data: unknown = event.data;
      const bytes = typeof data === "string" ? new TextEncoder().encode(data).length : data instanceof ArrayBuffer ? data.byteLength : 0;
      if (bytes > SOCKET_MESSAGE_LIMIT) {
        this.release(socket); socket.close(1000, "Message limit exceeded"); this.callbacks.onState("error");
        this.emit("error", "Incoming message exceeded the 2 MB limit. Connection closed."); return;
      }
      if (typeof data === "string") this.emit("received", data, bytes);
      else if (data instanceof ArrayBuffer) {
        const preview = Array.from(new Uint8Array(data).slice(0, 256), byte => byte.toString(16).padStart(2, "0")).join(" ");
        this.emit("received", "Binary message (" + bytes + " bytes)\n" + preview + (bytes > 256 ? "\n[hex preview truncated]" : ""), bytes, true);
      } else this.emit("error", "Unsupported incoming message type.");
    };
    const error = () => { if (active()) this.emit("error", "WebSocket connection error. The browser does not expose handshake details; check the endpoint, TLS, origin and authentication."); };
    const close = (event: CloseEvent) => {
      if (!active()) return;
      this.release(socket);
      const clean = event.wasClean || event.code === 1000 || event.code === 1001;
      this.callbacks.onState(clean ? "disconnected" : "error");
      this.emit(clean ? "system" : "error", "Connection closed | Code " + event.code + (event.reason ? " | " + event.reason : "") + (event.wasClean ? " | Clean close" : ""));
    };
    const relayError = (event: Event) => { if (active()) this.emit("error", String((event as CustomEvent).detail)); };
    socket.addEventListener("relay-error", relayError);
    socket.addEventListener("open", open); socket.addEventListener("message", message);
    socket.addEventListener("error", error); socket.addEventListener("close", close);
    this.detach = () => { socket.removeEventListener("relay-error", relayError); socket.removeEventListener("open", open); socket.removeEventListener("message", message); socket.removeEventListener("error", error); socket.removeEventListener("close", close); };
    const safeUrl = new URL(url);
    safeUrl.search = "";
    this.callbacks.onState("connecting"); this.emit("system", "Connecting to " + safeUrl.toString());
    this.timer = setTimeout(() => {
      if (!active()) return;
      this.release(socket); socket.close(1000, "Connection timeout"); this.callbacks.onState("error");
      this.emit("error", "Connection timed out after " + Math.round((this.callbacks.timeoutMs || 15000) / 1000) + " seconds.");
    }, this.callbacks.timeoutMs || 15000);
    return url;
  }

  private writable(bytes: number) {
    if (!this.socket || this.socket.readyState !== 1) throw new Error("Connect to a WebSocket before sending messages.");
    if (bytes > SOCKET_MESSAGE_LIMIT) throw new Error("Messages must be 2 MB or smaller.");
    if (this.socket.bufferedAmount + bytes > SOCKET_MESSAGE_LIMIT) throw new Error("The outgoing buffer is full. Wait before sending another message.");
    return this.socket;
  }

  sendText(text: string, format: "text" | "json") {
    if (format === "json") { try { JSON.parse(text); } catch { throw new Error("Enter a valid JSON message."); } }
    const bytes = new TextEncoder().encode(text).length;
    this.writable(bytes).send(text); this.emit("sent", text, bytes);
  }
  sendBinary(file: Blob, name = "binary message") {
    this.writable(file.size).send(file); this.emit("sent", "Binary file: " + name, file.size, true);
  }
  disconnect() {
    const socket = this.socket;
    if (!socket) return;
    this.release(socket); socket.close(1000, "Disconnected by user");
    this.callbacks.onState("disconnected"); this.emit("system", "Disconnected by user.");
  }
  dispose() {
    const socket = this.socket;
    if (socket) { this.release(socket); socket.close(1000, "Client closed"); }
    this.clearTimer();
  }
}
