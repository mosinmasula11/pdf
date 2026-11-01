import { createHash } from "node:crypto";

const cache = new Map<string, ArrayBuffer>();
let cacheSize = 0;

// Only compiler resources are downloaded; document contents never leave the browser.
export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const parts = path[1] === "pk" ? path.slice(2) : path.slice(1);
  if (path[0] !== "pdftex" || parts.length !== 2 || !/^\d{1,4}$/.test(parts[0]) || !/^[\w+.-]{1,140}$/.test(parts[1]) || parts[1].includes("..")) return new Response(null, { status: 404 });
  try {
    const key = path.join("/");
    const id = createHash("sha256").update(key).digest("hex");
    const headers = { "Content-Type": "application/octet-stream", fileid: id, pkid: id, "Cache-Control": "public, max-age=604800, immutable" };
    const cached = cache.get(key);
    if (cached) return new Response(cached, { headers });
    const upstream = await fetch(`https://texlive.texlyre.org/${path.map(encodeURIComponent).join("/")}`, { signal: AbortSignal.timeout(20000), redirect: "manual", cache: "no-store" });
    if (!upstream.ok) return new Response(null, { status: 404 });
    if (Number(upstream.headers.get("content-length")) > 32 * 1024 * 1024) return new Response(null, { status: 413 });
    const data = await upstream.arrayBuffer();
    if (data.byteLength > 32 * 1024 * 1024) return new Response(null, { status: 413 });
    if (cacheSize + data.byteLength > 48 * 1024 * 1024 || cache.size >= 256) { cache.clear(); cacheSize = 0; }
    cache.set(key, data); cacheSize += data.byteLength;
    return new Response(data, { headers });
  } catch { return new Response("LaTeX package download unavailable. Retry compilation.", { status: 502 }); }
}
