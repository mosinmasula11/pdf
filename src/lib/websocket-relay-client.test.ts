import { afterEach, describe, expect, it, vi } from "vitest";
import { RelaySocket } from "./websocket-relay-client";

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const encoder = new TextEncoder();
  const requests: Record<string, unknown>[] = [];
  const stream = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
  const fetcher = vi.fn(async (_url: string, options: RequestInit) => {
    const body = JSON.parse(options.body as string); requests.push(body);
    if (body.action === "connect") return new Response(stream);
    return Response.json({ ok: true });
  });
  vi.stubGlobal("fetch", fetcher);
  return { requests, fetcher, event(value: object) { controller.enqueue(encoder.encode(JSON.stringify(value) + "\n")); }, close() { controller.close(); } };
}
const wait = () => new Promise(resolve => setTimeout(resolve, 0));
describe("relay browser transport", () => {
  it("opens only after upstream success and preserves ordered text/binary sends", async () => {
    const fixtureApi = fixture(), socket = new RelaySocket("wss://example.com", [], { Authorization: "Bearer synthetic" });
    const opened = vi.fn(), received = vi.fn(); socket.addEventListener("open", opened); socket.addEventListener("message", received);
    await wait(); expect(socket.readyState).toBe(0);
    fixtureApi.event({ type: "session", id: "session", token: "ephemeral" });
    fixtureApi.event({ type: "open", protocol: "echo" }); await wait();
    expect(opened).toHaveBeenCalledOnce(); expect(socket.readyState).toBe(1); expect(socket.protocol).toBe("echo");
    socket.send("one"); socket.send(new Blob([new Uint8Array([1, 2, 3])])); await wait(); await wait();
    expect(fixtureApi.requests.slice(1)).toMatchObject([{ action: "send", data: "one", binary: false }, { action: "send", data: "AQID", binary: true }]);
    expect(fixtureApi.fetcher.mock.calls[1][1].headers).toMatchObject({ "X-Relay-Token": "ephemeral" });
    fixtureApi.event({ type: "message", binary: true, data: "AQID" }); await wait();
    expect(new Uint8Array(received.mock.calls[0][0].data)).toEqual(new Uint8Array([1, 2, 3]));
    expect(socket.bufferedAmount).toBe(0); socket.close(); await wait();
    expect(fixtureApi.requests.at(-1)).toMatchObject({ action: "close", id: "session" }); expect(socket.readyState).toBe(3);
  });
  it("reports HTTP authentication failures and stream interruptions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "Handshake rejected: HTTP 401." }, { status: 400 })));
    const socket = new RelaySocket("wss://example.com", [], {}), errors = vi.fn(), closed = vi.fn();
    socket.addEventListener("relay-error", errors); socket.addEventListener("close", closed); await wait();
    expect(errors.mock.calls[0][0].detail).toContain("401"); expect(closed).toHaveBeenCalledOnce();
    const fixtureApi = fixture(), other = new RelaySocket("wss://example.com", [], {}), ended = vi.fn(); other.addEventListener("close", ended);
    await wait(); fixtureApi.close(); await wait(); expect(ended.mock.calls[0][0].code).toBe(1006);
  });
  it("ignores late session/open events after cancellation", async () => {
    const fixtureApi = fixture(), socket = new RelaySocket("wss://example.com", [], {}), opened = vi.fn();
    socket.addEventListener("open", opened); socket.close(); await wait();
    fixtureApi.event({ type: "open" }); await wait(); expect(opened).not.toHaveBeenCalled(); expect(socket.readyState).toBe(3);
  });
});
