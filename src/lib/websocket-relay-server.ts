import WebSocket from "ws";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { resolveApiDestination, createPinnedApiLookup } from "./api-proxy";
import { parseSocketUrl, parseSocketProtocols, SOCKET_MESSAGE_LIMIT } from "./websocket-client";
import { prepareSocketRequest, EMPTY_SOCKET_AUTH } from "./websocket-auth";
import { readApiText } from "./api-request";

type Session = { socket: WebSocket; token: string; origin: string; finish: () => void; sending: boolean };
type Registry = { sessions: Map<string, Session>; active: number; calls: number; start: number };
const globalRelay = globalThis as typeof globalThis & { msynSocketRelay?: Registry };
const registry = globalRelay.msynSocketRelay ||= { sessions: new Map(), active: 0, calls: 0, start: 0 };
const fail = (error: string, status = 400) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const equalToken = (left: string, right: string) => {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function handleSocketRelay(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return fail("Start WebSocket connections from this site's API client.", 403);
  try {
    const input = JSON.parse(await readApiText(new Response(request.body), 3 * 1024 * 1024, AbortSignal.any([request.signal, AbortSignal.timeout(10000)])));
    if (!input || typeof input !== "object") return fail("A request object is required.");
    if (input.action === "send" || input.action === "close") {
      const session = typeof input.id === "string" ? registry.sessions.get(input.id) : null;
      if (!session || session.origin !== origin || !equalToken(session.token, request.headers.get("x-relay-token") || "")) return fail("This relay connection has expired or is unavailable. Reconnect.", 404);
      if (input.action === "close") { session.finish(); return Response.json({ ok: true }); }
      if (session.socket.readyState !== WebSocket.OPEN || session.sending) return fail("Connection is not ready for another message.", 409);
      if (typeof input.data !== "string" || typeof input.binary !== "boolean") return fail("Provide a text or binary message.");
      if (input.binary && (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data) || input.data.length % 4)) return fail("Invalid binary encoding.");
      const data = input.binary ? Buffer.from(input.data, "base64") : input.data;
      if (Buffer.byteLength(data) > SOCKET_MESSAGE_LIMIT || session.socket.bufferedAmount + Buffer.byteLength(data) > SOCKET_MESSAGE_LIMIT) return fail("Message or outgoing buffer exceeds 2 MB.", 413);
      session.sending = true;
      try { await new Promise<void>((resolve, reject) => session.socket.send(data, { binary: input.binary }, (error?: Error) => error ? reject(error) : resolve())); }
      finally { session.sending = false; }
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    if (input.action !== "connect") return fail("Unknown WebSocket action.");
    if (Date.now() - registry.start > 60000) { registry.start = Date.now(); registry.calls = 0; }
    if (registry.active >= 8 || ++registry.calls > 60) return fail("The WebSocket relay is busy. Try again shortly.", 429);
    if (typeof input.url !== "string" || !Array.isArray(input.protocols) || input.protocols.some((p: unknown) => typeof p !== "string") || !input.headers || typeof input.headers !== "object" || Array.isArray(input.headers)) return fail("Provide a WebSocket URL, protocols and headers.");
    const url = new URL(parseSocketUrl(input.url, "https:"));
    const protocols = parseSocketProtocols(input.protocols.join(","));
    const pairs = Object.entries(input.headers).map(([key, value], index) => {
      if (typeof value !== "string") throw new Error("Header values must be text.");
      return { id: String(index), enabled: true, key, value };
    });
    const { headers } = prepareSocketRequest(url.toString(), [], pairs, EMPTY_SOCKET_AUTH);
    // No redirects, private networks or unvalidated DNS lookups. TLS verification remains on.
    registry.active++;
    let destination;
    try {
      const httpUrl = new URL(url); httpUrl.protocol = "https:";
      destination = await resolveApiDestination(httpUrl, AbortSignal.any([request.signal, AbortSignal.timeout(5000)]));
    } catch (error) { registry.active--; throw error; }
    if (request.signal.aborted) { registry.active--; return fail("Connection cancelled.", 499); }
    let socket: WebSocket;
    try {
      socket = new WebSocket(url, protocols, { headers, followRedirects: false, rejectUnauthorized: true,
        handshakeTimeout: 10000, maxPayload: SOCKET_MESSAGE_LIMIT, perMessageDeflate: false,
        lookup: createPinnedApiLookup(destination), family: destination.family });
    } catch { registry.active--; return fail("Could not start the upstream WebSocket."); }
    const id = randomBytes(24).toString("hex"), token = randomBytes(32).toString("hex");
    const encoder = new TextEncoder();
    let ended = false, controller: ReadableStreamDefaultController<Uint8Array>;
    let lifetime: ReturnType<typeof setTimeout>, heartbeat: ReturnType<typeof setInterval>;
    const emit = (event: object) => {
      if (ended) return;
      if (controller.desiredSize !== null && controller.desiredSize < -4 * 1024 * 1024) { finish(); return; }
      try { controller.enqueue(encoder.encode(JSON.stringify(event) + "\n")); } catch { finish(); }
    };
    const finish = () => {
      if (ended) return;
      ended = true; registry.active--; registry.sessions.delete(id);
      clearTimeout(lifetime); clearInterval(heartbeat);
      request.signal.removeEventListener("abort", finish);
      if (socket.readyState === WebSocket.OPEN) { socket.close(1000, "Relay session ended"); const timer = setTimeout(() => socket.terminate(), 1000); timer.unref(); }
      else if (socket.readyState === WebSocket.CONNECTING) socket.terminate();
      try { controller.close(); } catch { /* Consumer already cancelled. */ }
    };
    const stream = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
        registry.sessions.set(id, { socket, token, origin, finish, sending: false });
        emit({ type: "session", id, token });
        lifetime = setTimeout(() => { emit({ type: "close", code: 1000, reason: "Relay session reached its 5 minute limit. Reconnect to continue." }); finish(); }, 300000);
        heartbeat = setInterval(() => emit({ type: "heartbeat" }), 15000);
        request.signal.addEventListener("abort", finish, { once: true });
        socket.on("open", () => emit({ type: "open", protocol: socket.protocol }));
        socket.on("message", (data, binary) => emit({ type: "message", binary, data: binary ? Buffer.from(data as Buffer).toString("base64") : data.toString() }));
        socket.on("unexpected-response", (_req, response) => {
          emit({ type: "error", message: "Handshake rejected: HTTP " + response.statusCode + ". Check authentication and endpoint permissions." });
          response.destroy(); finish();
        });
        socket.on("error", () => { emit({ type: "error", message: "Upstream WebSocket failed. Check authentication, TLS and endpoint availability." }); finish(); });
        socket.on("close", (code, reason) => { emit({ type: "close", code, reason: reason.toString() }); finish(); });
      },
      cancel() { finish(); },
    }, { highWaterMark: 4 * 1024 * 1024, size: chunk => chunk.byteLength });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
  } catch (error) { return fail(error instanceof Error ? error.message : "WebSocket relay failed."); }
}
