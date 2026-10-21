import { NextResponse } from "next/server";
import { allowDevLocalRequest, callDevLocalApi } from "@/lib/api-dev-local";
import { API_TIMEOUT_MS, readApiText } from "@/lib/api-request";

let active = 0;

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "The hosted server cannot access your computer's localhost. A local agent is required." }, { status: 403 });
  if (!allowDevLocalRequest(request, process.env.NODE_ENV)) return new Response(null, { status: 404 });
  if (active >= 8) return NextResponse.json({ error: "Too many local requests. Try again shortly." }, { status: 429 });
  active++;
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(API_TIMEOUT_MS)]);
  try {
    const payload = JSON.parse(await readApiText(new Response(request.body), 512 * 1024, signal));
    if (!payload || typeof payload.url !== "string" || typeof payload.method !== "string"
      || !payload.headers || typeof payload.headers !== "object" || Array.isArray(payload.headers)
      || Object.values(payload.headers).some(value => typeof value !== "string")
      || (payload.body !== null && typeof payload.body !== "string")) throw new Error("Invalid local request.");
    return NextResponse.json(await callDevLocalApi(payload, signal));
  } catch (error) {
    return NextResponse.json({ error: signal.aborted ? "Local request timed out or was cancelled." : error instanceof Error ? error.message : "Local request failed." }, { status: 400 });
  } finally { active--; }
}
