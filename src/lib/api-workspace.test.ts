import { describe, expect, it } from "vitest";
import { DEFAULT_COLLECTION, apiHistoryKey, deduplicateApiHistory, recordApiHistory, exportApiCollection, groupApiHistory, importApiCollection, normalizeCollections } from "./api-workspace";
import type { ApiRequestConfig } from "./api-request";

const request: ApiRequestConfig & { name: string; params: [] } = {
  name: "Create item", method: "POST", url: "https://example.com/items?token=secret",
  params: [], headers: [{ id: "1", key: "Authorization", value: "Bearer secret", enabled: true }],
  authType: "bearer", bearerToken: "secret", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyPlacement: "header",
  bodyType: "json", bodyJson: '{"name":"Widget","password":"secret"}', bodyRaw: "", bodyFormData: [],
};

describe("API workspace collections", () => {
  it("migrates missing storage and deduplicates collection IDs", () => {
    expect(normalizeCollections(null)).toEqual([DEFAULT_COLLECTION]);
    expect(normalizeCollections([{ id: "a", name: " Products " }, { id: "a", name: "Duplicate" }, null, { name: "Invalid" }])).toEqual([DEFAULT_COLLECTION, { id: "a", name: "Products" }]);
  });
  it("retains a renamed default collection", () => {
    expect(normalizeCollections([{ id: "default", name: "My API" }])).toEqual([{ id: "default", name: "My API" }]);
  });
  it("exports valid Postman v2 JSON without authentication secrets", () => {
    const exported = exportApiCollection("Products", [request]);
    expect(exported.info.schema).toContain("/v2.1.0/");
    expect(JSON.stringify(exported)).not.toContain("secret");
    expect(exported.item[0].request.method).toBe("POST");
    expect(exported.item[0].request.body?.raw).toContain("Widget");
  });
  it("round-trips request method, JSON body and content type", () => {
    const imported = importApiCollection(exportApiCollection("Products", [request]));
    expect(imported.name).toBe("Products");
    expect(imported.requests[0]).toMatchObject({ name: "Create item", method: "POST", bodyType: "json" });
    expect(JSON.parse(imported.requests[0].bodyJson)).toEqual({ name: "Widget", password: "" });
    expect(imported.requests[0].headers).toContainEqual(expect.objectContaining({ key: "content-type", value: "application/json" }));
  });
  it("imports nested folders with full request names and disabled form fields", () => {
    const imported = importApiCollection({ info: { name: "API" }, item: [{ name: "Products", item: [
      { name: "Create", request: { method: "POST", url: { raw: "https://example.com/items" }, body: { mode: "urlencoded", urlencoded: [{ key: "name", value: "Widget" }, { key: "debug", value: "1", disabled: true }] } } },
    ] }] });
    expect(imported.requests[0].name).toBe("Products / Create");
    expect(imported.requests[0].bodyFormData).toMatchObject([{ key: "name", enabled: true }, { key: "debug", enabled: false }]);
  });
  it("redacts imported credentials and token query parameters", () => {
    const imported = importApiCollection({ info: { name: "API" }, item: [{ name: "Read", request: { method: "GET", url: "https://example.com?access_token=secret", header: [{ key: "Authorization", value: "Bearer secret" }], auth: { type: "bearer", bearer: [{ key: "token", value: "secret" }] } } }] });
    expect(JSON.stringify(imported)).not.toContain("secret");
    expect(imported.requests[0].authType).toBe("bearer");
  });
  it("retains an imported API-key name and query placement, without its value", () => {
    const imported = importApiCollection({ info: { name: "API" }, item: [{ name: "Read", request: { url: "https://example.com", auth: { type: "apikey", apikey: [{ key: "key", value: "custom_key" }, { key: "in", value: "query" }, { key: "value", value: "secret" }] } } }] });
    expect(imported.requests[0]).toMatchObject({ authType: "apikey", apiKeyName: "custom_key", apiKeyPlacement: "query", apiKeyValue: "" });
    expect(JSON.stringify(imported)).not.toContain("secret");
  });
  it.each([null, {}, { info: { name: "" }, item: [] }, { info: { name: "API" }, item: {} }])("rejects invalid collection structures %#", value => {
    expect(() => importApiCollection(value)).toThrow("Postman");
  });
  it.each([
    { method: "TRACE", url: "https://example.com" },
    { method: "GET" },
    { method: "POST", url: "https://example.com", body: { mode: "formdata" } },
  ])("rejects unsupported or incomplete request definitions %#", value => {
    expect(() => importApiCollection({ info: { name: "API" }, item: [{ name: "Request", request: value }] })).toThrow();
  });
  it("limits the number of imported requests", () => {
    expect(() => importApiCollection({ info: { name: "API" }, item: Array.from({ length: 201 }, () => ({ name: "Read", request: "https://example.com" })) })).toThrow("200");
  });
});

it("groups recent history by day and ignores invalid timestamps", () => {
  const now = new Date(2026, 9, 19, 12);
  const groups = groupApiHistory([
    { timestamp: new Date(2026, 9, 19, 10).getTime() },
    { timestamp: new Date(2026, 9, 18, 10).getTime() },
    { timestamp: new Date(2026, 9, 17, 10).getTime() },
    { timestamp: NaN },
  ], now);
  expect(groups.map(group => group.label).slice(0, 2)).toEqual(["Today", "Yesterday"]);
  expect(groups).toHaveLength(3);
  expect(groups.reduce((sum, group) => sum + group.requests.length, 0)).toBe(3);
});

describe('request list deduplication', () => {
  const first = { ...request, id: 'first', timestamp: 1 };
  it('refreshes the same entry on repeated sends and retains its ID', () => {
    const result = recordApiHistory([first], { ...first, id: 'new', timestamp: 2, name: 'Another name', headers: first.headers.map(row => ({ ...row, id: 'changed-row-id' })) });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'first', timestamp: 2 });
  });
  it('retains changes to URL, parameters, method, headers and body', () => {
    for (const changes of [{ url: 'https://example.com/other' }, { url: 'https://example.com/items?page=2' }, { method: 'PUT' }, { headers: [{ id: 'h', key: 'Accept', value: 'text/plain', enabled: true }] }, { bodyJson: '{"name":"Different"}' }]) {
      expect(recordApiHistory([first], { ...first, ...changes, id: 'second', timestamp: 2 })).toHaveLength(2);
    }
  });
  it('removes previously stored duplicates, keeping the most recent entry', () => {
    expect(deduplicateApiHistory([first, { ...first, id: 'second', timestamp: 2 }])).toMatchObject([{ id: 'second' }]);
  });
  it('compares saved and recent requests without names or credentials', () => {
    expect(apiHistoryKey(first)).toBe(apiHistoryKey({ ...first, name: 'Saved name', bearerToken: 'other-secret' }));
  });
});

it('keeps original list position when an existing request is sent again', () => {
  const original = { ...request, id: 'original', timestamp: 10 };
  const newer = { ...request, id: 'newer', url: 'https://example.com/new', timestamp: 20 };
  const result = recordApiHistory([original, newer], { ...original, id: 'repeat', timestamp: 30 });
  const ordered = result.sort((a, b) => ((a as typeof a & { createdAt?: number }).createdAt ?? a.timestamp) - ((b as typeof b & { createdAt?: number }).createdAt ?? b.timestamp));
  expect(ordered.map(item => item.id)).toEqual(['original', 'newer']);
});
