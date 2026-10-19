import { afterEach, expect, it, vi } from "vitest";
import { lookup } from "node:dns/promises";
import type { LookupAddress, LookupAllOptions } from "node:dns";
import { callPublicApi, resolveApiDestination } from "./api-proxy";

const fake = vi.hoisted(() => ({ replies: [] as { status: number; headers?: Record<string,string>; body?: Buffer; hang?: boolean }[], calls: [] as { url: string; options: Record<string, unknown>; body: string }[] }));
vi.mock("node:dns/promises", () => ({ lookup: vi.fn(async () => [{ address: "1.1.1.1", family: 4 }]) }));
vi.mock("node:http", async () => {
  const { EventEmitter } = await import("node:events");
  return { request: (url: URL, options: Record<string, unknown>, callback: (response: unknown) => void) => {
    const call = { url: url.toString(), options, body: "" }; fake.calls.push(call);
    const reply = fake.replies.shift();
    if (!reply) throw new Error("Unexpected network attempt.");
    const req = Object.assign(new EventEmitter(), {
      write(value: string) { call.body += value; },
      destroy(this: import("node:events").EventEmitter, error: Error) { this.emit("error", error); },
      end() { if (!reply.hang) queueMicrotask(() => {
        const response = Object.assign(new EventEmitter(), { statusCode: reply.status, statusMessage: "test", headers: reply.headers || {}, destroy(this: import("node:events").EventEmitter, error: Error) { this.emit("error", error); } });
        callback(response); if (reply.body) response.emit("data", reply.body); response.emit("end");
      }); },
    });
    (options.signal as AbortSignal).addEventListener("abort", () => req.destroy(new Error("Aborted")), { once: true });
    return req;
  } };
});
vi.mock("node:https", async () => ({ request: (await import("node:http")).request }));
const lookupAll = vi.mocked(lookup as (host: string, options: LookupAllOptions) => Promise<LookupAddress[]>);
afterEach(() => { fake.calls.length = 0; fake.replies.length = 0; lookupAll.mockResolvedValue([{ address: "1.1.1.1", family: 4 }]); });
const input = { url: "https://example.com/api", method: "POST", headers: { Authorization: "Bearer qa" }, body: "QA body" };

it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "::ffff:127.0.0.1"])("blocks private or mapped destination %s before connecting", async address => {
  lookupAll.mockResolvedValue([{ address, family: address.includes(":") ? 6 : 4 }]);
  await expect(callPublicApi(input, new AbortController().signal)).rejects.toThrow("blocked");
  expect(fake.calls).toHaveLength(0);
});
it("rejects mixed public/private DNS answers and empty DNS results", async () => {
  lookupAll.mockResolvedValue([{ address: "1.1.1.1", family: 4 }, { address: "10.0.0.1", family: 4 }]);
  await expect(resolveApiDestination(new URL(input.url), new AbortController().signal)).rejects.toThrow("blocked");
  lookupAll.mockResolvedValue([]);
  await expect(resolveApiDestination(new URL(input.url), new AbortController().signal)).rejects.toThrow("blocked");
});

it("pins validated DNS to the socket and preserves the exact body", async () => {
  fake.replies.push({ status: 201, headers: { "content-type": "application/json" }, body: Buffer.from('{"ok":true}') });
  const result = await callPublicApi(input, new AbortController().signal);
  expect(result.status).toBe(201); expect(result.data).toBe('{"ok":true}');
  expect(fake.calls[0].body).toBe(input.body);
  const callback = vi.fn();
  (fake.calls[0].options.lookup as (host: string, options: object, callback: unknown) => void)("example.com", {}, callback);
  expect(callback).toHaveBeenCalledWith(null, "1.1.1.1", 4);
  const allCallback = vi.fn();
  (fake.calls[0].options.lookup as (host: string, options: object, callback: unknown) => void)("example.com", { all: true }, allCallback);
  expect(allCallback).toHaveBeenCalledWith(null, [{ address: "1.1.1.1", family: 4 }]);
  expect(fake.calls[0].options.family).toBe(4);
  expect(fake.calls[0].options.autoSelectFamily).toBe(false);
});
it("revalidates redirects and never connects to a private destination", async () => {
  fake.replies.push({ status: 302, headers: { location: "http://127.0.0.1/private" } });
  await expect(callPublicApi({ ...input, url: "http://example.com", method: "GET", body: null }, new AbortController().signal)).rejects.toThrow("blocked");
  expect(fake.calls).toHaveLength(1);
});
it("removes authentication on cross-origin GET redirects", async () => {
  fake.replies.push({ status: 302, headers: { location: "https://other.example/test" } }, { status: 200, body: Buffer.from("OK") });
  await callPublicApi({ ...input, method: "GET", body: null }, new AbortController().signal);
  expect(fake.calls[1].options.headers).not.toHaveProperty("authorization");
});
it("refuses to forward a body to another origin", async () => {
  fake.replies.push({ status: 307, headers: { location: "https://other.example/test" } });
  await expect(callPublicApi(input, new AbortController().signal)).rejects.toThrow("Cross-origin");
  expect(fake.calls).toHaveLength(1);
});
it("rejects oversized upstream data", async () => {
  fake.replies.push({ status: 200, body: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(callPublicApi(input, new AbortController().signal)).rejects.toThrow("limit");
});
it("sets the UTF-8 body length for DELETE requests", async () => {
  fake.replies.push({ status: 200, body: Buffer.from("OK") });
  const body = "नमस्ते";
  await callPublicApi({ ...input, method: "DELETE", body }, new AbortController().signal);
  expect(fake.calls[0].options.headers).toHaveProperty("content-length", String(Buffer.byteLength(body)));
  expect(fake.calls[0].body).toBe(body);
});
it("cancels a stalled upstream connection", async () => {
  fake.replies.push({ status: 200, hang: true });
  const controller = new AbortController();
  const result = callPublicApi(input, controller.signal);
  setTimeout(() => controller.abort(), 10);
  await expect(result).rejects.toThrow("Aborted");
});
