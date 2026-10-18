import type { Metadata } from "next";
import { EpochConverterTool } from "@/components/tools/EpochConverterTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("epoch-converter");

import { Suspense } from "react";

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Unix Timestamp & Epoch Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Live ticking Unix timestamp counter and converter between epoch seconds/milliseconds and human-readable dates across timezones.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
          <EpochConverterTool />
        </Suspense>
      </div>
    </div>
  );
}

