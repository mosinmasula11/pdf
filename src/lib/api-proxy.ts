import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { API_METHODS, API_RESPONSE_LIMIT, parseApiUrl } from "./api-request";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) blocked.addSubnet(address, prefix, "ipv6");

export function isPublicApiAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address, "ipv4")
    : family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}

export async function resolveApiDestination(url: URL, signal: AbortSignal) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("The proxy supports public endpoints on ports 80 and 443. Use direct mode for other ports.");
  signal.throwIfAborted();
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }]
    : await new Promise<{ address: string; family: number }[]>((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      lookup(host, { all: true, verbatim: true }).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    });
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(entry => !isPublicApiAddress(entry.address))) {
    throw new Error("Private, local, and reserved destinations are blocked by the proxy. Use direct mode for local APIs.");
  }
  return addresses[0];
}

export function proxyHeaders(input: Record<string, string>) {
  const headers = new Headers(input);
  const connectionHeaders = (headers.get("connection") || "").split(",").map(value => value.trim());
  for (const key of [...connectionHeaders, "host", "content-length", "connection", "transfer-encoding", "upgrade", "keep-alive", "proxy-authorization", "proxy-authenticate", "te", "trailer", "accept-encoding"]) {
    if (key) headers.delete(key);
  }
  headers.set("accept-encoding", "identity");
  return Object.fromEntries(headers);
}

interface ProxyInput { url: string; method: string; headers: Record<string, string>; body: string | null }
export async function callPublicApi(input: ProxyInput, signal: AbortSignal) {
  if (!API_METHODS.includes(input.method)) throw new Error("Unsupported HTTP method.");
  let url = parseApiUrl(input.url), method = input.method, body = input.body;
  let headers = proxyHeaders(input.headers);
  const started = performance.now();
  for (let redirect = 0; redirect <= 4; redirect++) {
    const address = await resolveApiDestination(url, signal);
    const result = await new Promise<{ status: number; statusText: string; headers: Record<string, string>; data: Buffer }>((resolve, reject) => {
      // Pin the validated address, retaining the original Host and TLS hostname.
      const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
        method, headers, signal, agent: false,
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      }, response => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > API_RESPONSE_LIMIT) {
            const error = new Error("Response exceeds the 2048 KB limit.");
            response.destroy(error); req.destroy(error);
          } else chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("aborted", () => reject(new Error("The upstream response was interrupted.")));
        response.on("end", () => {
          const responseHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers)) if (value !== undefined) responseHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
          resolve({ status: response.statusCode || 0, statusText: response.statusMessage || "", headers: responseHeaders, data: Buffer.concat(chunks) });
        });
      });
      req.on("error", reject);
      if (body !== null && !["GET", "HEAD"].includes(method)) req.write(body);
      req.end();
    });
    if ([301, 302, 303, 307, 308].includes(result.status) && result.headers.location) {
      if (redirect === 4) throw new Error("Too many redirects (maximum 4).");
      const next = parseApiUrl(new URL(result.headers.location, url).toString());
      if (url.protocol === "https:" && next.protocol !== "https:") throw new Error("HTTPS to HTTP redirects are blocked.");
      if (next.origin !== url.origin) {
        headers = Object.fromEntries(Object.entries(headers).filter(([key]) => ["accept", "accept-language", "content-type", "accept-encoding"].includes(key.toLowerCase())));
      }
      if ((result.status === 303 && method !== "HEAD") || ([301, 302].includes(result.status) && method === "POST")) {
        method = "GET"; body = null; delete headers["content-type"];
      }
      url = next;
      continue;
    }
    const encoding = result.headers["content-encoding"];
    if (encoding && encoding !== "identity") throw new Error("The endpoint returned a compressed response despite requesting plain text.");
    const contentType = result.headers["content-type"] || "text/plain";
    if (result.data.length && !/text\/|json|xml|javascript|x-www-form-urlencoded/i.test(contentType)) {
      throw new Error("This client displays text responses. Binary responses are not supported.");
    }
    return { ok: result.status >= 200 && result.status < 300, status: result.status, statusText: result.statusText,
      headers: result.headers, data: result.data.toString("utf8"), sizeBytes: result.data.length,
      durationMs: Math.round(performance.now() - started), contentType };
  }
  throw new Error("Too many redirects.");
}
