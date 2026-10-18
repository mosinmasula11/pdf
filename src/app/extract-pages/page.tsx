import type { Metadata } from "next";
import { ExtractPagesTool } from "@/components/tools/ExtractPagesTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("extract-pages");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Extract Pages from PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Choose specific pages to extract into a single combined PDF or save each page as an individual PDF.
      </p>
      <div className="mt-8">
        <ExtractPagesTool />
      </div>
    </div>
  );
}

