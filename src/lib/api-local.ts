import { parseApiUrl } from "./api-request";

export function apiDestinationKind(value: string): "public" | "loopback" | "local" {
  try {
    const host = parseApiUrl(value).hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    const parts = host.split(".").map(part => part !== "" ? Number(part) : -1);
    const ipv4 = parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255);
    if (host === "localhost" || host.endsWith(".localhost") || host === "::1" || (ipv4 && parts[0] === 127)) return "loopback";
    if (host.endsWith(".local") || (ipv4 && (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31))) || /^(fc|fd)[0-9a-f]{2}:|^fe[89ab][0-9a-f]:/i.test(host)) return "local";
  } catch { /* URL validation is handled when sending. */ }
  return "public";
}

export function directApiOptions(_url: string, method: string, headers: Record<string, string>, body: string | null, signal: AbortSignal): RequestInit {
  return { method, headers, body, signal, mode: "cors", credentials: "omit" };
}

export function directApiFailure(error: unknown, url: string) {
  if (!(error instanceof TypeError)) return error instanceof Error ? error.message : "Request failed.";
  return apiDestinationKind(url) !== "public"
    ? "Could not connect to the local API."
    : "Could not connect to the API.";
}

export function parseLocalResponse(text: string) {
  if (new TextEncoder().encode(text).length > 16 * 1024 * 1024) throw new Error("Response file exceeds 16 MB.");
  const value = JSON.parse(text);
  if (!value || value.format !== "msyn-local-response-v1" || !value.request || typeof value.request.url !== "string" || apiDestinationKind(value.request.url) !== "loopback" || typeof value.request.method !== "string" || typeof value.data !== "string" || typeof value.statusText !== "string"
    || !Number.isInteger(value.status) || (value.status !== 0 && (value.status < 100 || value.status > 599))
    || typeof value.contentType !== "string" || !value.headers || typeof value.headers !== "object" || Array.isArray(value.headers)
    || Object.values(value.headers).some(header => typeof header !== "string")
    || !Number.isFinite(value.durationMs) || value.durationMs < 0 || new TextEncoder().encode(value.data).length > 2 * 1024 * 1024) {
    throw new Error("Choose a response JSON file created by the MSYN local request runner.");
  }
  return { status: value.status as number, statusText: value.statusText as string, headers: value.headers as Record<string,string>,
    data: value.data as string, contentType: value.contentType as string, durationMs: value.durationMs as number,
    sizeBytes: new TextEncoder().encode(value.data).length, isError: value.status === 0,
    source: `${value.request.method} ${value.request.url}` };
}
