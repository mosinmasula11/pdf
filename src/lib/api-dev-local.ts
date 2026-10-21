import { isIP } from "node:net";
import { apiDestinationKind } from "./api-local";
import { API_METHODS, parseApiUrl, readApiText } from "./api-request";
import { proxyHeaders } from "./api-proxy";

export function allowDevLocalRequest(request: Request, environment: string | undefined) {
  const page = new URL(request.url);
  return environment === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(page.hostname)
    && request.headers.get("origin") === page.origin
    && (!request.headers.has("sec-fetch-site") || request.headers.get("sec-fetch-site") === "same-origin");
}

export function devLocalDestination(value: string) {
  const url = parseApiUrl(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host !== "localhost" && (!isIP(host) || apiDestinationKind(value) === "public")) {
    throw new Error("Use localhost or a local IP address for local development requests.");
  }
  // No DNS lookup for arbitrary names and no redirects to unvalidated targets.
  if (host === "localhost") url.hostname = "127.0.0.1";
  url.hash = "";
  return url;
}

export async function callDevLocalApi(input: { url: string; method: string; headers: Record<string, string>; body: string | null }, signal: AbortSignal) {
  if (!API_METHODS.includes(input.method)) throw new Error("Unsupported HTTP method.");
  const url = devLocalDestination(input.url);
  const started = performance.now();
  const response = await fetch(url, { method: input.method, headers: proxyHeaders(input.headers),
    body: ["GET", "HEAD"].includes(input.method) ? null : input.body, signal, redirect: "manual", cache: "no-store" });
  const data = await readApiText(response, undefined, signal);
  return { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers),
    data, contentType: response.headers.get("content-type") || "text/plain", sizeBytes: Buffer.byteLength(data),
    durationMs: Math.round(performance.now() - started), isError: !response.ok };
}
