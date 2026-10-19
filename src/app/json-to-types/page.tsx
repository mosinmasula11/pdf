import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonToTypesTool } from "@/components/tools/JsonToTypesTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("json-to-types");

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">
        JSON to TypeScript & Zod Schema Generator
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        Convert raw JSON payloads into clean TypeScript interfaces, Zod validation schemas, Python Pydantic models, or Go structs instantly in your browser.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />}>
          <JsonToTypesTool />
        </Suspense>
      </div>
    </div>
  );
}

