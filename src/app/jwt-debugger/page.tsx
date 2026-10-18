import type { Metadata } from "next";
import { JwtDebuggerTool } from "@/components/tools/JwtDebuggerTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("jwt-debugger");

import { Suspense } from "react";

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Private JWT Debugger & Token Inspector</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        Decode and inspect JSON Web Tokens (Header, Payload, Claims, Expiry) and verify HMAC-SHA256 signatures 100% locally in your browser with zero server transmission.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
          <JwtDebuggerTool />
        </Suspense>
      </div>
    </div>
  );
}

