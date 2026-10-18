import type { Metadata } from "next";
import { CaseConverterTool } from "@/components/tools/CaseConverterTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("case-converter");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Text Case Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Easily convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case, and more in real-time.
      </p>
      <div className="mt-8">
        <CaseConverterTool />
      </div>
    </div>
  );
}

