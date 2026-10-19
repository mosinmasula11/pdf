import { describe, expect, it } from "vitest";
import { EMPTY_SOCKET_AUTH, prepareSocketRequest } from "./websocket-auth";
const row = (key: string, value: string) => ({ id: key, enabled: true, key, value });
describe("WebSocket authentication", () => {
  it("adds bearer headers without changing the URL", () => {
    const result = prepareSocketRequest("wss://example.com/ws", [], [], { ...EMPTY_SOCKET_AUTH, type: "bearer", token: "test-token" });
    expect(result.headers).toEqual({ authorization: "Bearer test-token" }); expect(result.url).not.toContain("test-token");
  });
  it("encodes Basic credentials including Unicode", () => {
    const result = prepareSocketRequest("wss://example.com", [], [], { ...EMPTY_SOCKET_AUTH, type: "basic", username: "user", password: "páss" });
    expect(result.headers.authorization).toBe("Basic " + Buffer.from("user:páss").toString("base64"));
  });
  it("adds API keys in the selected location", () => {
    const auth = { ...EMPTY_SOCKET_AUTH, type: "apiKey" as const, key: "X-API-Key", value: "secret" };
    expect(prepareSocketRequest("wss://example.com", [], [], auth).headers).toEqual({ "x-api-key": "secret" });
    expect(new URL(prepareSocketRequest("wss://example.com", [], [], { ...auth, location: "query" }).url).searchParams.get("X-API-Key")).toBe("secret");
  });
  it("merges enabled parameters and custom headers", () => {
    const result = prepareSocketRequest("wss://example.com?room=old", [row("room", "one"), { ...row("off", "value"), enabled: false }], [row("X-Tenant", "test")], EMPTY_SOCKET_AUTH);
    expect(new URL(result.url).search).toBe("?room=one"); expect(result.headers).toEqual({ "x-tenant": "test" });
  });
  it("rejects injection, reserved headers, duplicates and conflicting authorization", () => {
    for (const key of ["Host", "Connection", "Sec-WebSocket-Key", "Proxy-Authorization", "bad name"]) expect(() => prepareSocketRequest("wss://example.com", [], [row(key, "x")], EMPTY_SOCKET_AUTH)).toThrow();
    expect(() => prepareSocketRequest("wss://example.com", [], [row("X-Test", "x\r\nevil: 1")], EMPTY_SOCKET_AUTH)).toThrow();
    expect(() => prepareSocketRequest("wss://example.com", [], [row("X-Test", "1"), row("x-test", "2")], EMPTY_SOCKET_AUTH)).toThrow();
    expect(() => prepareSocketRequest("wss://example.com", [], [row("authorization", "manual")], { ...EMPTY_SOCKET_AUTH, type: "bearer", token: "test" })).toThrow();
    expect(() => prepareSocketRequest("wss://example.com", [], [], { ...EMPTY_SOCKET_AUTH, type: "apiKey", key: "Host", value: "bad" })).toThrow();
  });
  it("requires complete credentials and bounds header sizes", () => {
    expect(() => prepareSocketRequest("wss://example.com", [], [], { ...EMPTY_SOCKET_AUTH, type: "bearer" })).toThrow();
    expect(() => prepareSocketRequest("wss://example.com", [], [], { ...EMPTY_SOCKET_AUTH, type: "basic", username: "bad:user" })).toThrow();
    expect(() => prepareSocketRequest("wss://example.com", [], [row("x-test", "x".repeat(17000))], EMPTY_SOCKET_AUTH)).toThrow();
  });
});
