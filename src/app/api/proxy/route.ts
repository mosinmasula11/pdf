import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { url, method = "GET", headers = {}, body = null } = payload;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid 'url' is required." },
        { status: 400 }
      );
    }

    // Clean up headers to avoid conflict
    const fetchHeaders: Record<string, string> = { ...headers };
    delete fetchHeaders["host"];
    delete fetchHeaders["content-length"];

    const startTime = performance.now();
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: fetchHeaders,
      redirect: "follow",
      cache: "no-store",
    };

    if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const responseText = await response.text();
    const sizeBytes = new TextEncoder().encode(responseText).length;

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText || (response.ok ? "OK" : "Error"),
      headers: responseHeaders,
      data: responseText,
      durationMs: duration,
      sizeBytes,
      contentType: response.headers.get("content-type") || "text/plain",
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      status: 0,
      statusText: "Network Error",
      headers: {},
      data: error?.message || "Failed to connect to the server or endpoint was unreachable.",
      durationMs: 0,
      sizeBytes: 0,
      contentType: "text/plain",
      error: error?.message || "Connection failed",
    });
  }
}

