// HTTP streaming carries relay events; the upstream connection uses native WebSocket framing.
export class RelaySocket extends EventTarget {
  readyState = 0;
  bufferedAmount = 0;
  binaryType = "arraybuffer";
  protocol = "";
  private abort = new AbortController();
  private id = "";
  private token = "";
  private closed = false;
  private failureReason = "";
  private queue: Promise<void> = Promise.resolve();
  constructor(url: string, protocols: string[], headers: Record<string, string>) {
    super();
    void this.start(url, protocols, headers);
  }
  private finish(code: number, reason: string, clean = false) {
    if (this.closed) return;
    this.closed = true; this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean: clean }));
  }
  private async start(url: string, protocols: string[], headers: Record<string, string>) {
    try {
      const response = await fetch("/api/websocket", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", url, protocols, headers }), signal: this.abort.signal, cache: "no-store" });
      if (!response.ok || !response.body) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "WebSocket relay unavailable (" + response.status + ").");
      }
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let buffer = "";
      while (!this.closed) {
        const part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        if (buffer.length > 4 * 1024 * 1024) throw new Error("Relay event exceeded the size limit.");
        let end: number;
        while ((end = buffer.indexOf("\n")) !== -1 && !this.closed) {
          const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "session") { this.id = event.id; this.token = event.token; }
          else if (event.type === "open") { this.readyState = 1; this.protocol = event.protocol || ""; this.dispatchEvent(new Event("open")); }
          else if (event.type === "message") {
            const data = event.binary ? Uint8Array.from(atob(event.data), char => char.charCodeAt(0)).buffer : event.data;
            this.dispatchEvent(new MessageEvent("message", { data }));
          } else if (event.type === "error") {
            this.failureReason = String(event.message);
            this.dispatchEvent(new CustomEvent("relay-error", { detail: event.message }));
          } else if (event.type === "close") this.finish(event.code, event.reason, event.code === 1000 || event.code === 1001);
        }
      }
      if (!this.closed) this.finish(1006, this.failureReason || "Relay stream ended unexpectedly.");
    } catch (error) {
      if (this.closed) return;
      this.dispatchEvent(new CustomEvent("relay-error", { detail: error instanceof Error ? error.message : "Relay connection failed." }));
      this.finish(1006, "Relay connection failed.");
    } finally { this.abort.abort(); }
  }
  send(data: string | Blob | ArrayBuffer) {
    if (this.readyState !== 1) throw new Error("The relay is not connected.");
    const size = typeof data === "string" ? new TextEncoder().encode(data).length : data instanceof Blob ? data.size : data.byteLength;
    if (size + this.bufferedAmount > 2 * 1024 * 1024) throw new Error("The outgoing buffer is full.");
    this.bufferedAmount += size;
    this.queue = this.queue.then(async () => {
      if (this.closed) return;
      const binary = typeof data !== "string";
      const bytes = binary ? new Uint8Array(data instanceof Blob ? await data.arrayBuffer() : data as ArrayBuffer) : null;
      let encoded = "";
      if (bytes) for (let i = 0; i < bytes.length; i += 8192) encoded += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const response = await fetch("/api/websocket", { method: "POST", headers: { "Content-Type": "application/json", "X-Relay-Token": this.token },
        body: JSON.stringify({ action: "send", id: this.id, binary, data: binary ? btoa(encoded) : data }), signal: this.abort.signal, cache: "no-store" });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || "Message delivery failed."); }
    }).catch(error => {
      if (!this.closed) { this.dispatchEvent(new CustomEvent("relay-error", { detail: error.message })); this.close(1000, "Message delivery failed"); }
    }).finally(() => { this.bufferedAmount = Math.max(0, this.bufferedAmount - size); });
  }
  close(code = 1000, reason = "Client closed") {
    if (this.closed) return;
    if (this.id) void fetch("/api/websocket", { method: "POST", headers: { "Content-Type": "application/json", "X-Relay-Token": this.token },
      body: JSON.stringify({ action: "close", id: this.id }), keepalive: true }).catch(() => {});
    this.finish(code, reason, true); this.abort.abort();
  }
}
