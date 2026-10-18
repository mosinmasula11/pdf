export interface ApiRow { id: string; key: string; value: string; enabled: boolean }
export interface ApiRequestConfig {
  method: string; url: string; headers: ApiRow[];
  authType: "none" | "bearer" | "basic" | "apikey";
  bearerToken: string; basicUser: string; basicPass: string;
  apiKeyName: string; apiKeyValue: string; apiKeyPlacement: "header" | "query";
  bodyType: "none" | "json" | "form-data" | "urlencoded" | "raw";
  bodyJson: string; bodyRaw: string; bodyFormData: ApiRow[];
}
export const API_TIMEOUT_MS = 30_000;
export const API_RESPONSE_LIMIT = 2 * 1024 * 1024;
export const API_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function parseApiUrl(value: string) {
  const url = new URL(value.includes("://") ? value.trim() : `https://${value.trim()}`);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Use an HTTP or HTTPS URL without embedded credentials.");
  }
  if (!url.hostname) throw new Error("Enter a valid API URL.");
  return url;
}

export function apiParams(value: string): ApiRow[] {
  try {
    return Array.from(parseApiUrl(value).searchParams, ([key, value], index) => ({
      id: String(index), key, value, enabled: true,
    }));
  } catch { return []; }
}

export function compileApiRequest(config: ApiRequestConfig) {
  const url = parseApiUrl(config.url);
  url.hash = "";
  if (config.authType === "apikey" && config.apiKeyPlacement === "query" && config.apiKeyName.trim()) {
    url.searchParams.set(config.apiKeyName.trim(), config.apiKeyValue);
  }
  const headers = new Headers();
  for (const row of config.headers) if (row.enabled && row.key.trim()) headers.set(row.key.trim(), row.value);
  if (config.authType === "bearer" && config.bearerToken.trim()) {
    headers.set("Authorization", `Bearer ${config.bearerToken.trim()}`);
  } else if (config.authType === "basic" && (config.basicUser || config.basicPass)) {
    const bytes = new TextEncoder().encode(`${config.basicUser}:${config.basicPass}`);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    headers.set("Authorization", `Basic ${btoa(binary)}`);
  } else if (config.authType === "apikey" && config.apiKeyPlacement === "header" && config.apiKeyName.trim()) {
    headers.set(config.apiKeyName.trim(), config.apiKeyValue);
  }
  let body: string | null = null;
  if (!["GET", "HEAD"].includes(config.method)) {
    if (config.bodyType === "json") {
      JSON.parse(config.bodyJson);
      body = config.bodyJson;
      if (!headers.has("content-type")) headers.set("Content-Type", "application/json");
    } else if (config.bodyType === "raw") body = config.bodyRaw;
    else if (config.bodyType === "urlencoded") {
      const form = new URLSearchParams();
      for (const row of config.bodyFormData) if (row.enabled && row.key) form.append(row.key, row.value);
      body = form.toString();
      if (!headers.has("content-type")) headers.set("Content-Type", "application/x-www-form-urlencoded");
    }
  }
  return { url: url.toString(), method: config.method, headers: Object.fromEntries(headers), body };
}

const secretKey = /authorization|cookie|password|passwd|secret|token|api.?key|credential|signature/i;
const safeHeader = /^(accept|accept-language|content-type|cache-control)$/i;
function redactJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, secretKey.test(k) ? "" : redactJson(v)]));
  return value;
}

// Called both when writing and when migrating previously saved requests.
export function sanitizeApiRequest<T extends ApiRequestConfig & { params: ApiRow[] }>(item: T): T {
  let url = item.url;
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    parsed.username = ""; parsed.password = ""; parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (secretKey.test(key) || (item.authType === "apikey" && key === item.apiKeyName)) parsed.searchParams.set(key, "");
    }
    url = parsed.toString();
  } catch { /* Invalid draft URLs may still be saved. */ }
  let bodyJson = item.bodyJson;
  try { bodyJson = JSON.stringify(redactJson(JSON.parse(bodyJson)), null, 2); } catch { /* Keep invalid drafts. */ }
  return {
    ...item, url, bearerToken: "", basicUser: "", basicPass: "", apiKeyValue: "",
    params: (item.params || []).map(row => ({ ...row, value: secretKey.test(row.key) || row.key === item.apiKeyName ? "" : row.value })),
    headers: (item.headers || []).map(row => ({ ...row, value: safeHeader.test(row.key) ? row.value : "" })),
    bodyFormData: (item.bodyFormData || []).map(row => ({ ...row, value: secretKey.test(row.key) ? "" : row.value })),
    bodyRaw: item.bodyRaw || "", bodyJson,
  };
}

export async function readApiText(response: Response, limit = API_RESPONSE_LIMIT, signal?: AbortSignal) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytes = 0, text = "";
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      signal?.throwIfAborted();
      const chunk = await reader.read();
      signal?.throwIfAborted();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > limit) throw new Error(`Response exceeds the ${Math.round(limit / 1024)} KB limit.`);
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { signal?.removeEventListener("abort", abort); await reader.cancel().catch(() => {}); }
}

export function apiSnippet(config: ApiRequestConfig, language: string) {
  const request = compileApiRequest(config);
  const q = JSON.stringify;
  const shell = (s: string) => `'${s.replace(/'/g, `'"'"'`)}'`;
  const php = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  const entries = Object.entries(request.headers);
  const hasBody = request.body !== null;
  switch (language) {
    case "curl": return [`curl --request ${request.method} ${shell(request.url)}`, ...entries.map(([k,v]) => `  --header ${shell(`${k}: ${v}`)}`), ...(hasBody ? [`  --data-raw ${shell(request.body!)}`] : [])].join(" \\\n");
    case "js": return `fetch(${q(request.url)}, {\n  method: ${q(request.method)},\n  headers: ${q(request.headers)},${hasBody ? `\n  body: ${q(request.body)},` : ""}\n})\n  .then(response => response.text())\n  .then(console.log)\n  .catch(console.error);`;
    case "node": return `const axios = require("axios");\naxios({\n  method: ${q(request.method)},\n  url: ${q(request.url)},\n  headers: ${q(request.headers)},${hasBody ? `\n  data: ${q(request.body)},\n  transformRequest: [(data) => data],` : ""}\n}).then(response => console.log(response.data)).catch(console.error);`;
    case "python": return `import requests\n\nresponse = requests.request(\n    ${q(request.method)}, ${q(request.url)},\n    headers=${q(request.headers)},${hasBody ? `\n    data=${q(request.body)}.encode("utf-8"),` : ""}\n    timeout=30,\n)\nprint(response.status_code)\nprint(response.text)`;
    case "php": return `<?php\n$curl = curl_init();\ncurl_setopt_array($curl, [\n  CURLOPT_URL => ${php(request.url)},\n  CURLOPT_CUSTOMREQUEST => ${php(request.method)},\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_TIMEOUT => 30,\n  CURLOPT_HTTPHEADER => [${entries.map(([k,v]) => php(`${k}: ${v}`)).join(", ")}],${hasBody ? `\n  CURLOPT_POSTFIELDS => ${php(request.body!)},` : ""}\n]);\necho curl_exec($curl);\ncurl_close($curl);`;
    case "go": return `package main\n\nimport (\n  "fmt"\n  "io"\n  "net/http"\n  "time"${hasBody ? '\n  "strings"' : ""}\n)\n\nfunc main() {\n  client := &http.Client{Timeout: 30 * time.Second}\n  req, err := http.NewRequest(${q(request.method)}, ${q(request.url)}, ${hasBody ? `strings.NewReader(${q(request.body)})` : "nil"})\n  if err != nil { panic(err) }\n${entries.map(([k,v]) => `  req.Header.Set(${q(k)}, ${q(v)})`).join("\n")}\n  resp, err := client.Do(req)\n  if err != nil { panic(err) }\n  defer resp.Body.Close()\n  body, err := io.ReadAll(resp.Body)\n  if err != nil { panic(err) }\n  fmt.Printf("%s\\n", body)\n}`;
    default: throw new Error("Unsupported snippet language.");
  }
}
