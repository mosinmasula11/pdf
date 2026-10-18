import type { Metadata } from "next";
import { PdfSummarizerTool } from "@/components/tools/PdfSummarizerTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-summarize");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF Summarizer</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Extract key sentences and recurring topics from PDF text locally.
      </p>
      <div className="mt-8">
        <PdfSummarizerTool />
      </div>
    </div>
  );
}

