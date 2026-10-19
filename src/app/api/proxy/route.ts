import { NextResponse } from "next/server";
import { API_METHODS, API_TIMEOUT_MS, readApiText } from "@/lib/api-request";
import { callPublicApi } from "@/lib/api-proxy";

let active = 0, windowStart = 0, calls = 0;
function failure(message: string, httpStatus: number) {
  return NextResponse.json({ ok: false, isError: true, status: 0, statusText: "Request Error", headers: {}, data: message,
    durationMs: 0, sizeBytes: 0, contentType: "text/plain", error: message }, { status: httpStatus });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return failure("Send proxy requests from this site's API client.", 403);
  if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); calls = 0; }
  if (active >= 8 || ++calls > 120) return failure("The proxy is busy. Try again shortly or use direct mode.", 429);
  active++;
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(API_TIMEOUT_MS)]);
  try {
    const payload: unknown = JSON.parse(await readApiText(new Response(request.body), 512 * 1024, signal));
    if (!payload || typeof payload !== "object") return failure("A request object is required.", 400);
    const { url, method = "GET", headers = {}, body = null } = payload as Record<string, unknown>;
    if (typeof url !== "string" || !url.trim() || typeof method !== "string" || !API_METHODS.includes(method.toUpperCase())
      || !headers || typeof headers !== "object" || Array.isArray(headers) || Object.values(headers).some(value => typeof value !== "string")
      || (body !== null && typeof body !== "string")) return failure("Provide a valid URL, HTTP method, string headers, and text body.", 400);
    return NextResponse.json(await callPublicApi({ url, method: method.toUpperCase(), headers: headers as Record<string, string>, body: body as string | null }, signal));
  } catch (error) {
    return failure(signal.aborted ? "Request cancelled or timed out after 30 seconds." : error instanceof Error ? error.message : "Request failed.", signal.aborted ? 504 : 400);
  } finally { active--; }
}
