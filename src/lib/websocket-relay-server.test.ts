import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { WebSocketServer } from "ws";
const test = vi.hoisted(() => ({ port: 0, headers: {} as Record<string, unknown>, options: {} as Record<string, unknown> }));
vi.mock("./api-proxy", async importOriginal => {
  const original = await importOriginal<typeof import("./api-proxy")>();
  return { ...original, resolveApiDestination: vi.fn(async (url: URL) => {
    if (url.hostname !== "example.com") throw new Error("Private, local, and reserved destinations are blocked by the proxy.");
    return { address: "127.0.0.1", family: 4 };
  }) };
});
vi.mock("ws", async importOriginal => {
  const original = await importOriginal<typeof import("ws")>();
  class TestSocket extends original.default {
    constructor(url: string | URL, protocols: string[], options: Record<string, unknown>) {
      test.options = options;
      // Only the test transport maps the validated public TLS destination to our loopback fixture.
      super("ws://127.0.0.1:" + test.port + new URL(url).pathname, protocols, options);
    }
  }
  return { ...original, default: TestSocket };
});
import { handleSocketRelay } from "./websocket-relay-server";
let server: Server, wss: WebSocketServer;
beforeAll(async () => {
  server = createServer(); wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    test.headers = request.headers;
    if (request.url === "/reject") { socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n"); return; }
    wss.handleUpgrade(request, socket, head, client => wss.emit("connection", client, request));
  });
  wss.on("connection", socket => socket.on("message", (data, binary) => socket.send(data, { binary })));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  test.port = (server.address() as { port: number }).port;
});
afterAll(async () => { for (const socket of wss.clients) socket.terminate(); await new Promise<void>(resolve => wss.close(() => server.close(() => resolve()))); });
const request = (payload: unknown, token?: string, origin = "http://localhost") => new Request("http://localhost/api/websocket", { method: "POST", headers: { origin, "content-type": "application/json", ...(token ? { "x-relay-token": token } : {}) }, body: JSON.stringify(payload) });
const connect = (url = "wss://example.com/socket", headers = { Authorization: "Bearer synthetic-test-token" }) => handleSocketRelay(request({ action: "connect", url, protocols: [], headers }));
async function events(response: Response) {
  expect(response.status).toBe(200);
  const reader = response.body!.getReader(), decoder = new TextDecoder(); let buffer = "";
  return { reader, async next() {
    while (!buffer.includes("\n")) { const part = await reader.read(); if (part.done) throw new Error("Unexpected stream end"); buffer += decoder.decode(part.value, { stream: true }); }
    const end = buffer.indexOf("\n"), event = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1); return event;
  } };
}
describe("secured WebSocket relay", () => {
  it("sends real authenticated text and binary handshakes and expires session tokens on close", async () => {
    const stream = await events(await connect()), session = await stream.next();
    try {
      expect(session.type).toBe("session"); expect((await stream.next()).type).toBe("open");
      expect(test.headers.authorization).toBe("Bearer synthetic-test-token");
      expect(test.options).toMatchObject({ rejectUnauthorized: true, followRedirects: false, perMessageDeflate: false, family: 4 });
      expect((await handleSocketRelay(request({ action: "send", id: session.id, data: "hello", binary: false }, "wrong"))).status).toBe(404);
      expect((await handleSocketRelay(request({ action: "send", id: session.id, data: "hello", binary: false }, session.token))).status).toBe(200);
      expect(await stream.next()).toMatchObject({ type: "message", data: "hello", binary: false });
      await handleSocketRelay(request({ action: "send", id: session.id, data: "AQID", binary: true }, session.token));
      expect(await stream.next()).toMatchObject({ data: "AQID", binary: true });
      await handleSocketRelay(request({ action: "close", id: session.id }, session.token));
      expect((await handleSocketRelay(request({ action: "send", id: session.id, data: "late", binary: false }, session.token))).status).toBe(404);
    } finally { await stream.reader.cancel(); }
  });
  it("blocks foreign origins, insecure/private targets and reserved headers", async () => {
    expect((await handleSocketRelay(request({ action: "connect" }, undefined, "https://evil.example"))).status).toBe(403);
    for (const url of ["ws://example.com", "wss://127.0.0.1", "wss://internal.invalid"]) expect((await connect(url)).status).toBe(400);
    expect((await connect("wss://example.com", { Host: "internal" } as unknown as { Authorization: string })).status).toBe(400);
  });
  it("reports upstream rejection without reflecting secrets", async () => {
    const stream = await events(await connect("wss://example.com/reject"));
    try {
      await stream.next(); const event = await stream.next();
      expect(event).toMatchObject({ type: "error" }); expect(event.message).toContain("401"); expect(event.message).not.toContain("synthetic-test-token");
    } finally { await stream.reader.cancel(); }
  });
});
