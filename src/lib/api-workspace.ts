import { API_METHODS, apiParams, compileApiRequest, sanitizeApiRequest } from "./api-request";
import type { ApiRequestConfig, ApiRow } from "./api-request";

export interface ApiCollection { id: string; name: string }
export const DEFAULT_COLLECTION = { id: "default", name: "My collection" };
export type WorkspaceMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type CollectionRequest = ApiRequestConfig & { name: string; params: ApiRow[] };

export function normalizeCollections(value: unknown): ApiCollection[] {
  const seen = new Set<string>();
  const items = Array.isArray(value) ? value.filter((item): item is ApiCollection =>
    !!item && typeof item.id === "string" && !!item.id && typeof item.name === "string" && !!item.name.trim()
  ).filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; })
    .map(item => ({ id: item.id, name: item.name.trim().slice(0, 100) })) : [];
  return seen.has(DEFAULT_COLLECTION.id) ? items : [DEFAULT_COLLECTION, ...items];
}

export function exportApiCollection(name: string, requests: CollectionRequest[]) {
  return {
    info: { name, schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    item: requests.map(request => {
      const compiled = compileApiRequest(sanitizeApiRequest(request));
      return { name: request.name, request: {
        method: compiled.method, url: compiled.url,
        header: Object.entries(compiled.headers).map(([key, value]) => ({ key, value })),
        ...(compiled.body !== null ? { body: { mode: "raw", raw: compiled.body,
          options: { raw: { language: request.bodyType === "json" ? "json" : "text" } } } } : {}),
      } };
    }),
  };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function rows(value: unknown): ApiRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(record).filter(item => typeof item.key === "string").map((item, index) => ({
    id: String(index), key: String(item.key), value: typeof item.value === "string" ? item.value : "", enabled: item.disabled !== true,
  }));
}

export function importApiCollection(value: unknown) {
  const root = record(value), info = record(root.info);
  if (typeof info.name !== "string" || !info.name.trim() || !Array.isArray(root.item)) throw new Error("Choose a Postman v2 collection JSON file.");
  const requests: (CollectionRequest & { method: WorkspaceMethod })[] = [];
  const visit = (items: unknown[], path: string[], depth: number) => {
    if (depth > 8) throw new Error("Collection folders exceed the supported nesting depth.");
    for (const item of items) {
      const entry = record(item), name = typeof entry.name === "string" ? entry.name : "Untitled request";
      if (Array.isArray(entry.item)) { visit(entry.item, [...path, name], depth + 1); continue; }
      const req = typeof entry.request === "string" ? { url: entry.request, method: "GET" } : record(entry.request);
      const method = typeof req.method === "string" ? req.method.toUpperCase() : "GET";
      if (!API_METHODS.includes(method)) throw new Error("Unsupported HTTP method in " + name + ".");
      const rawUrl = typeof req.url === "string" ? req.url : record(req.url).raw;
      if (typeof rawUrl !== "string" || !rawUrl.trim()) throw new Error("A request URL is missing in " + name + ".");
      const body = record(req.body), auth = record(req.auth);
      const apiKeyOptions = rows(auth.apikey);
      const bodyRaw = typeof body.raw === "string" ? body.raw : "";
      const isJson = record(record(body.options).raw).language === "json" || rows(req.header).some(row => row.key.toLowerCase() === "content-type" && row.value.includes("json"));
      if (body.mode && !["raw", "urlencoded"].includes(String(body.mode))) throw new Error("Only text, JSON and URL-encoded bodies can be imported (" + name + ").");
      if (requests.length >= 200) throw new Error("Import up to 200 requests at a time.");
      const config: CollectionRequest & { method: WorkspaceMethod } = {
        name: [...path, name].join(" / ").slice(0, 100), method: method as WorkspaceMethod, url: rawUrl,
        params: apiParams(rawUrl), headers: rows(req.header),
        authType: auth.type === "bearer" ? "bearer" : auth.type === "basic" ? "basic" : auth.type === "apikey" ? "apikey" : "none",
        bearerToken: "", basicUser: "", basicPass: "",
        apiKeyName: apiKeyOptions.find(option => option.key === "key")?.value || "X-API-Key", apiKeyValue: "",
        apiKeyPlacement: apiKeyOptions.find(option => option.key === "in")?.value === "query" ? "query" : "header",
        bodyType: body.mode === "urlencoded" ? "urlencoded" : body.mode === "raw" ? isJson ? "json" : "raw" : "none",
        bodyRaw, bodyJson: isJson ? bodyRaw : "", bodyFormData: rows(body.urlencoded),
      };
      requests.push(sanitizeApiRequest(config));
    }
  };
  visit(root.item, [], 0);
  return { name: info.name.trim().slice(0, 100), requests };
}

export function groupApiHistory<T extends { timestamp: number }>(items: T[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = new Date(item.timestamp);
    if (!Number.isFinite(date.getTime())) continue;
    const label = date >= today ? "Today" : date >= yesterday ? "Yesterday" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    groups.set(label, [...(groups.get(label) || []), item]);
  }
  return [...groups].map(([label, requests]) => ({ label, requests }));
}

// Compare the stored request configuration, excluding names, row IDs and send times.
export function apiHistoryKey<T extends ApiRequestConfig & { params: ApiRow[] }>(request: T) {
  const safe = sanitizeApiRequest(request);
  const rows = (items: ApiRow[]) => (items || []).filter(row => row.enabled && row.key.trim()).map(row => [row.key.trim(), row.value]);
  let wire;
  try { wire = compileApiRequest(safe); }
  catch { wire = { method: safe.method, url: safe.url, headers: rows(safe.headers), bodyType: safe.bodyType, bodyJson: safe.bodyJson, bodyRaw: safe.bodyRaw, bodyFormData: rows(safe.bodyFormData) }; }
  return JSON.stringify([wire, safe.authType, safe.authType === 'apikey' ? [safe.apiKeyName, safe.apiKeyPlacement] : null]);
}

export function deduplicateApiHistory<T extends ApiRequestConfig & { params: ApiRow[]; timestamp: number }>(items: T[]): T[] {
  const seen = new Set<string>();
  return [...items].sort((a, b) => b.timestamp - a.timestamp).filter(item => {
    const key = apiHistoryKey(item);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 25);
}

export function recordApiHistory<T extends ApiRequestConfig & { params: ApiRow[]; timestamp: number; id: string; createdAt?: number }>(items: T[], request: T): T[] {
  const key = apiHistoryKey(request);
  const existing = items.find(item => apiHistoryKey(item) === key);
  return deduplicateApiHistory([{ ...request, id: existing?.id || request.id, createdAt: existing?.createdAt ?? existing?.timestamp ?? request.timestamp }, ...items.filter(item => apiHistoryKey(item) !== key)]);
}
