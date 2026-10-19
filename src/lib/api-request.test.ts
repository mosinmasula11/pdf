import { describe, expect, it, vi, afterEach } from "vitest";
import vm from "node:vm";
import { apiParams, apiSnippet, compileApiRequest, readApiText, sanitizeApiRequest, type ApiRequestConfig } from "./api-request";
import { isPublicApiAddress, proxyHeaders, resolveApiDestination } from "./api-proxy";
import * as dns from "node:dns/promises";
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));

const base: ApiRequestConfig = {
  method: "POST", url: "https://example.com/api?x=1#fragment", headers: [], authType: "none",
  bearerToken: "", basicUser: "", basicPass: "", apiKeyName: "key", apiKeyValue: "",
  apiKeyPlacement: "header", bodyType: "raw", bodyRaw: "QA 'raw' `payload`\nनमस्ते", bodyJson: "{}", bodyFormData: [],
};
afterEach(() => vi.restoreAllMocks());
describe("API request regressions", () => {
  it("encodes Unicode Basic credentials as UTF-8 without crashing", () => {
    const result = compileApiRequest({ ...base, authType: "basic", basicUser: "परीक्षण", basicPass: "🔐test" });
    expect(Buffer.from(result.headers.authorization.slice(6), "base64").toString("utf8")).toBe("परीक्षण:🔐test");
  });
  it("compiles query auth before fragments and replaces existing auth values", () => {
    const result = compileApiRequest({ ...base, url: "https://example.com/?key=old#fragment", authType: "apikey", apiKeyPlacement: "query", apiKeyValue: "a&b" });
    expect(result.url).toBe("https://example.com/?key=a%26b");
  });
  it("compiles enabled form fields and respects case-insensitive content type", () => {
    const result = compileApiRequest({ ...base, bodyType: "urlencoded", headers: [{ id: "a", key: "content-type", value: "custom/form", enabled: true }], bodyFormData: [
      { id: "1", key: "qa", value: "hello & नमस्ते", enabled: true }, { id: "2", key: "off", value: "no", enabled: false },
    ] });
    expect(new URLSearchParams(result.body!).get("qa")).toBe("hello & नमस्ते");
    expect(new URLSearchParams(result.body!).has("off")).toBe(false);
    expect(result.headers["content-type"]).toBe("custom/form");
  });
  it("clears removed query parameters and handles duplicates", () => {
    expect(apiParams("https://example.com/")).toEqual([]);
    expect(apiParams("https://example.com/?")).toEqual([]);
    expect(apiParams("https://example.com/?a=1&a=2").map(row => row.value)).toEqual(["1", "2"]);
  });
  it("rejects invalid JSON only for methods sending a JSON body", () => {
    expect(() => compileApiRequest({ ...base, bodyType: "json", bodyJson: "{bad}" })).toThrow();
    expect(compileApiRequest({ ...base, method: "HEAD", bodyType: "json", bodyJson: "{bad}" }).body).toBeNull();
  });
  it("exports HEAD with cURL's no-body response mode", () => {
    const code = apiSnippet({ ...base, method: "HEAD" }, "curl");
    expect(code).toContain("--head"); expect(code).not.toContain("--data-raw");
  });
  it("executes generated JavaScript and Axios snippets with the exact raw body and compiled URL", async () => {
    for (const language of ["js", "node"]) {
      const config = { ...base, authType: "apikey" as const, apiKeyPlacement: "query" as const, apiKeyValue: "qa-key" };
      const expected = compileApiRequest(config);
      let actual: { url: string; body: string } | undefined;
      const response = Promise.resolve({ text: async () => "OK", data: "OK" });
      new vm.Script(apiSnippet(config, language)).runInNewContext({
        fetch: (url: string, options: { body: string }) => { actual = { url, body: options.body }; return response; },
        require: () => (options: { url: string; data: string }) => { actual = { url: options.url, body: options.data }; return response; },
        console: { log() {}, error() {} },
      });
      await response;
      expect(actual).toEqual({ url: expected.url, body: base.bodyRaw });
    }
  });
  it.each(["curl", "js", "node", "python", "php", "go"])("includes form body and query auth in %s exports", language => {
    const code = apiSnippet({ ...base, bodyType: "urlencoded", bodyFormData: [{ id: "1", key: "qa", value: "hello", enabled: true }], authType: "apikey", apiKeyPlacement: "query", apiKeyValue: "test-key" }, language);
    expect(code).toContain("qa=hello"); expect(code).toContain("key=test-key");
  });
  it("sanitizes old stored authentication while preserving a raw request body", () => {
    const item = { ...base, params: [{ id: "1", key: "access_token", value: "secret", enabled: true }],
      url: "https://user:password@example.com/?access_token=secret", bearerToken: "secret", basicPass: "secret", apiKeyValue: "secret",
      headers: [{ id: "1", key: "Authorization", value: "secret", enabled: true }, { id: "2", key: "X-Custom-Key", value: "secret", enabled: true }],
      bodyJson: '{"password":"secret","nested":{"access_token":"secret"},"title":"safe"}',
    };
    const saved = sanitizeApiRequest(item);
    expect(JSON.stringify(saved)).not.toContain("secret");
    expect(saved.url).not.toContain("password");
    expect(saved.bodyRaw).toBe(base.bodyRaw);
    expect(JSON.parse(saved.bodyJson).title).toBe("safe");
  });
  it("bounds streamed responses and supports cancellation", async () => {
    await expect(readApiText(new Response("123456"), 5)).rejects.toThrow("limit");
    const controller = new AbortController();
    const pending = readApiText(new Response(new ReadableStream({ start() {} })), 100, controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow();
  });
});

describe("API proxy destination protection", () => {
  it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "100.100.100.200", "0.0.0.0", "224.0.0.1", "::1", "::ffff:127.0.0.1", "fe80::1", "fc00::1", "2001:db8::1", "2002:7f00:1::"])("blocks %s without a network request", address => {
    expect(isPublicApiAddress(address)).toBe(false);
  });
  it("allows global addresses", () => {
    expect(isPublicApiAddress("1.1.1.1")).toBe(true);
    expect(isPublicApiAddress("2606:4700:4700::1111")).toBe(true);
  });
  it("rejects mixed public/private DNS results", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "1.1.1.1", family: 4 }, { address: "127.0.0.1", family: 4 }] as never);
    await expect(resolveApiDestination(new URL("https://example.com"), new AbortController().signal)).rejects.toThrow("blocked");
  });
  it("normalizes encoded loopback hosts before validation", async () => {
    await expect(resolveApiDestination(new URL("http://2130706433"), new AbortController().signal)).rejects.toThrow("blocked");
  });
  it("removes hop-by-hop and host headers regardless of casing", () => {
    const result = proxyHeaders({ Host: "wrong", "Content-Length": "500", Connection: "X-Hop", "X-Hop": "bad", Authorization: "Bearer qa" });
    expect(result).toEqual({ "accept-encoding": "identity", authorization: "Bearer qa" });
  });
});
