import { API_METHODS, parseApiUrl } from "./api-request";
import { apiDestinationKind } from "./api-local";

interface LocalRequest { url: string; method: string; headers: Record<string,string>; body: string | null }
export function createLocalApiRunner(config: LocalRequest) {
  const url = parseApiUrl(config.url);
  if (apiDestinationKind(url.toString()) !== "loopback") throw new Error("The local runner supports localhost and loopback URLs only.");
  if (!API_METHODS.includes(config.method)) throw new Error("Unsupported HTTP method.");
  // JSON is embedded as a literal, never executable request text.
  return RUNNER.replace("__MSYN_CONFIG__", () => JSON.stringify({ ...config, url: url.toString() }));
}

const RUNNER = String.raw`// MSYN one-request local runner. Requires Node.js 20+; no packages or listening server.
// This file contains your current request, including any authentication. Keep it private.
// node msyn-local-request.mjs --ca "C:\path\localhost-ca.pem" --out response.json
// Omit --ca for HTTP or a certificate trusted by Node. TLS verification stays enabled.
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { readFileSync, writeFileSync } from "node:fs";
const config = __MSYN_CONFIG__;
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!["--ca", "--out"].includes(args[i]) || !args[i + 1]) throw new Error("Use --ca certificate.pem and/or --out response.json");
  options[args[i]] = args[i + 1];
}
const output = options["--out"] || "msyn-response-" + Date.now() + ".json";
const ca = options["--ca"] ? readFileSync(options["--ca"]) : undefined;
const signal = AbortSignal.timeout(30000);
let url = new URL(config.url), method = config.method, body = config.body;
const initialOrigin = url.origin;
const headers = new Headers(config.headers);
for (const key of (headers.get("connection") || "").split(",").map(key => key.trim()).concat(["host", "content-length", "connection", "transfer-encoding", "upgrade", "proxy-authorization", "accept-encoding"])) if (key) headers.delete(key);
headers.set("accept-encoding", "identity");
const started = performance.now();
let result;
try {
  for (let redirects = 0; redirects <= 4; redirects++) {
    const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
    const parts = hostname.split(".").map(part => part !== "" ? Number(part) : -1);
    const loopbackV4 = parts.length === 4 && parts[0] === 127 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255);
    if (url.origin !== initialOrigin || url.username || url.password || !["http:", "https:"].includes(url.protocol)
      || !(hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || loopbackV4)) throw new Error("Only same-origin loopback requests and redirects are allowed.");
    const requestHeaders = Object.fromEntries(headers);
    if (body !== null && !["GET", "HEAD"].includes(method)) requestHeaders["content-length"] = String(Buffer.byteLength(body));
    result = await new Promise((resolve, reject) => {
      const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
        method, headers: requestHeaders, ca, rejectUnauthorized: true, signal, agent: false,
        // localhost is pinned to loopback; no DNS rebinding and no access to remote hosts.
        family: hostname === "::1" ? 6 : 4,
        lookup: (_host, settings, callback) => settings.all ? callback(null, [{address:"127.0.0.1",family:4}]) : callback(null,"127.0.0.1",4),
      }, res => {
        const chunks = []; let length = 0;
        res.on("data", chunk => { length += chunk.length; if (length > 2097152) { const error = new Error("Response exceeds 2 MB."); res.destroy(error); req.destroy(error); } else chunks.push(chunk); });
        res.on("error", reject); res.on("aborted", () => reject(new Error("Response interrupted.")));
        res.on("end", () => resolve({ status: res.statusCode || 0, statusText: res.statusMessage || "", headers: Object.fromEntries(Object.entries(res.headers).map(([key,value])=>[key,Array.isArray(value)?value.join(", "):String(value)])), data: Buffer.concat(chunks) }));
      });
      req.on("error", reject);
      if (body !== null && !["GET", "HEAD"].includes(method)) req.write(body);
      req.end();
    });
    if ([301,302,303,307,308].includes(result.status) && result.headers.location) {
      if (redirects === 4) throw new Error("Too many redirects.");
      url = new URL(result.headers.location, url);
      if ((result.status === 303 && method !== "HEAD") || ([301,302].includes(result.status) && method === "POST")) { method = "GET"; body = null; headers.delete("content-type"); }
      continue;
    }
    if (result.headers["content-encoding"] && result.headers["content-encoding"] !== "identity") throw new Error("Compressed responses are not supported by this runner.");
    const contentType = result.headers["content-type"] || "text/plain";
    if (result.data.length && !(contentType.startsWith("text/") || /json|xml|javascript|x-www-form-urlencoded/i.test(contentType))) throw new Error("Only text responses can be imported.");
    result = { ...result, data: result.data.toString("utf8"), contentType };
    break;
  }
} catch (error) {
  const code = error?.code || error?.cause?.code || "";
  const tls = /CERT|SELF_SIGNED|VERIFY_LEAF|TLS/.test(code);
  result = { status: 0, statusText: "Local request failed", headers: {}, contentType: "text/plain", data: tls ? "Certificate verification failed. Run again with --ca pointing to your own local CA/certificate PEM, and use a hostname covered by that certificate. " + code : (error?.message || "Request failed") };
}
const response = { format: "msyn-local-response-v1", request: { url: config.url, method: config.method }, ...result, durationMs: Math.round(performance.now() - started) };
writeFileSync(output, JSON.stringify(response, null, 2), { flag: "wx", mode: 0o600 });
console.log("Saved response to " + output + ". Import this file into the API client.");
if (response.status === 0) process.exitCode = 1;
`;
