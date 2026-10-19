import { createRequire } from "node:module";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { appendSocketLog, loadSocketProfiles, parseSocketProtocols, parseSocketUrl, sanitizeSocketProfile, SOCKET_MESSAGE_LIMIT, SocketSession } from "./websocket-client";
import type { SocketLogEntry, SocketState } from "./websocket-client";

class FakeSocket extends EventTarget {
  readyState = 0;
  binaryType = "blob";
  bufferedAmount = 0;
  protocol = "";
  sent: unknown[] = [];
  closed: unknown[][] = [];
  send(value: unknown) { this.sent.push(value); }
  close(...args: unknown[]) { this.closed.push(args); this.readyState = 3; }
  open() { this.readyState = 1; this.dispatchEvent(new Event("open")); }
  message(data: unknown) { this.dispatchEvent(new MessageEvent("message", { data })); }
  finish(code = 1000, reason = "", wasClean = true) { this.readyState = 3; this.dispatchEvent(Object.assign(new Event("close"), { code, reason, wasClean })); }
}
const sessions: SocketSession[] = [];
function setup(timeoutMs?: number) {
  const sockets: FakeSocket[] = [], states: SocketState[] = [], events: SocketLogEntry[] = [];
  const session = new SocketSession({ timeoutMs, onState: state => states.push(state), onEvent: entry => events.push(entry),
    createSocket: () => { const socket = new FakeSocket(); sockets.push(socket); return socket as unknown as WebSocket; } });
  sessions.push(session);
  return { session, sockets, states, events };
}
afterEach(() => { for (const session of sessions.splice(0)) session.dispose(); vi.useRealTimers(); });

describe("WebSocket input and privacy", () => {
  it.each(["ws://localhost:1234/socket", "wss://example.com/socket?room=1"])("accepts %s", value => expect(parseSocketUrl(value)).toBe(value));
  it.each(["https://example.com", "ftp://example.com", "socket", "ws://user:password@example.com", "ws://example.com/#fragment"])("rejects invalid or embedded-credential URL %s", value => expect(() => parseSocketUrl(value)).toThrow());
  it("rejects mixed content on secure pages", () => {
    expect(() => parseSocketUrl("ws://example.com", "https:")).toThrow("wss://");
    expect(parseSocketUrl("wss://example.com", "https:")).toBe("wss://example.com/");
  });
  it("validates subprotocol syntax and duplicates", () => {
    expect(parseSocketProtocols("chat, graphql-transport-ws")).toEqual(["chat", "graphql-transport-ws"]);
    expect(parseSocketProtocols("")).toEqual([]);
    for (const invalid of ["chat,chat", "chat,", "has space", "bad/protocol"]) expect(() => parseSocketProtocols(invalid)).toThrow();
  });
  it("never persists query values, arbitrary secrets or extra properties", () => {
    const saved = sanitizeSocketProfile({ id: "1", name: " Room ", url: "wss://example.com/socket?room=secret&custom=secret" });
    expect(saved.name).toBe("Room");
    expect(saved.url).toBe("wss://example.com/socket?room=&custom=");
    expect(JSON.stringify(saved)).not.toContain("secret");
    expect(loadSocketProfiles([saved, saved, { id: "bad", name: "Bad", url: "javascript:alert(1)" }, null])).toEqual([saved]);
  });
  it("bounds saved connections and log memory", () => {
    expect(loadSocketProfiles(Array.from({ length: 30 }, (_, index) => ({ id: String(index), name: "Socket", url: "ws://localhost/" })))).toHaveLength(25);
    let log: SocketLogEntry[] = [];
    for (let i = 0; i < 300; i++) log = appendSocketLog(log, { id: i, kind: "received", text: "x".repeat(64000), timestamp: 1, bytes: 64000 });
    expect(log.length).toBeLessThanOrEqual(200);
    expect(log.reduce((sum, item) => sum + item.text.length * 2, 0)).toBeLessThanOrEqual(SOCKET_MESSAGE_LIMIT);
  });
});

describe("WebSocket lifecycle", () => {
  it("connects, sends exact text and JSON, receives messages, and disconnects", () => {
    const { session, sockets, states, events } = setup();
    session.connect("ws://example.com/socket", "");
    expect(states).toEqual(["connecting"]); expect(sockets[0].binaryType).toBe("arraybuffer");
    expect(() => session.sendText("hello", "text")).toThrow("Connect");
    sockets[0].open();
    session.sendText("hello", "text"); session.sendText('{"hello":true}', "json");
    sockets[0].message("hello"); sockets[0].message(new Uint8Array([0, 255]).buffer);
    expect(sockets[0].sent).toEqual(["hello", '{"hello":true}']);
    expect(events.filter(entry => entry.kind === "received")).toMatchObject([{ text: "hello" }, { binary: true, bytes: 2, text: expect.stringContaining("00 ff") }]);
    session.disconnect(); expect(states.at(-1)).toBe("disconnected"); expect(sockets[0].closed[0]).toEqual([1000, "Disconnected by user"]);
  });
  it("rejects invalid JSON, oversized data and a full send buffer", () => {
    const { session, sockets } = setup(); session.connect("ws://example.com", ""); sockets[0].open();
    expect(() => session.sendText("{", "json")).toThrow("valid JSON");
    expect(() => session.sendText("x".repeat(SOCKET_MESSAGE_LIMIT + 1), "text")).toThrow("2 MB");
    sockets[0].bufferedAmount = SOCKET_MESSAGE_LIMIT;
    expect(() => session.sendText("hello", "text")).toThrow("buffer");
    expect(sockets[0].sent).toHaveLength(0);
  });
  it("sends binary data without converting it to text", () => {
    const { session, sockets, events } = setup(); session.connect("ws://example.com", ""); sockets[0].open();
    const blob = new Blob(["test"]); session.sendBinary(blob, "sample.bin");
    expect(sockets[0].sent[0]).toBe(blob);
    expect(events.at(-1)).toMatchObject({ kind: "sent", bytes: 4, binary: true });
  });
  it("preserves server close codes and reasons", () => {
    const { session, sockets, states, events } = setup(); session.connect("ws://example.com", ""); sockets[0].open();
    sockets[0].finish(1008, "Policy denied", false);
    expect(states.at(-1)).toBe("error"); expect(events.at(-1)?.text).toContain("1008 | Policy denied");
  });
  it("cancels connecting sockets and ignores late events after reconnect", () => {
    const { session, sockets, states, events } = setup(); session.connect("ws://example.com", ""); session.disconnect();
    session.connect("ws://other.example", "");
    const count = events.length; sockets[0].open(); sockets[0].message("late");
    expect(events).toHaveLength(count); expect(states.at(-1)).toBe("connecting");
    sockets[1].open(); expect(states.at(-1)).toBe("connected");
  });
  it("times out a stalled handshake and clears timers on open", () => {
    vi.useFakeTimers();
    const { session, sockets, states, events } = setup(1000); session.connect("ws://example.com", "");
    vi.advanceTimersByTime(1000); expect(states.at(-1)).toBe("error"); expect(events.at(-1)?.text).toContain("timed out");
    session.connect("ws://example.com", ""); sockets[1].open(); vi.advanceTimersByTime(2000);
    expect(states.at(-1)).toBe("connected");
  });
  it("disconnects on oversized incoming messages and truncates retained previews", () => {
    const { session, sockets, states, events } = setup(); session.connect("ws://example.com", ""); sockets[0].open();
    sockets[0].message("x".repeat(70000)); expect(events.at(-1)).toMatchObject({ truncated: true, bytes: 70000 }); expect(events.at(-1)?.text.length).toBe(65536);
    sockets[0].message("x".repeat(SOCKET_MESSAGE_LIMIT + 1)); expect(states.at(-1)).toBe("error"); expect(sockets[0].closed).toHaveLength(1);
  });
  it("disposes without updating unmounted UI and rejects overlapping connections", () => {
    const { session, sockets, states, events } = setup(); session.connect("ws://example.com", "");
    expect(() => session.connect("ws://example.com", "")).toThrow("Disconnect");
    session.dispose(); const count = events.length; sockets[0].open(); sockets[0].message("late");
    expect(events).toHaveLength(count); expect(states).toEqual(["connecting"]);
  });
});

describe("native WebSocket integration", () => {
  let fixture: { url: string; close: () => Promise<void> };
  beforeAll(async () => {
    const { startEchoServer } = createRequire(import.meta.url)("../../scripts/websocket-test-server.cjs") as { startEchoServer: (port: number) => Promise<typeof fixture> };
    fixture = await startEchoServer(0);
  });
  afterAll(async () => { await fixture?.close(); });
  it("round-trips text and binary frames against a real loopback server", async () => {
    const received: SocketLogEntry[] = [];
    let resolveOpen!: () => void, resolveMessages!: () => void;
    const opened = new Promise<void>(resolve => { resolveOpen = resolve; });
    const messages = new Promise<void>(resolve => { resolveMessages = resolve; });
    const session = new SocketSession({ onState: state => { if (state === "connected") resolveOpen(); }, onEvent: entry => { if (entry.kind === "received") { received.push(entry); if (received.length === 2) resolveMessages(); } } });
    sessions.push(session); session.connect(fixture.url, "msyn.echo");
    await opened; session.sendText("real echo", "text"); session.sendBinary(new Blob([new Uint8Array([0, 1, 255])]), "test.bin");
    await messages;
    expect(received[0].text).toBe("real echo"); expect(received[1]).toMatchObject({ binary: true, bytes: 3, text: expect.stringContaining("00 01 ff") });
    session.disconnect();
  }, 5000);
});
