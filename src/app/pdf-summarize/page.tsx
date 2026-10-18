import type { Metadata } from "next";
import { PdfSummarizerTool } from "@/components/tools/PdfSummarizerTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-summarize");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">AI PDF Summarizer</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Condense dense reports, research papers, and documents into key bullet points and executive overviews in seconds.
      </p>
      <div className="mt-8">
        <PdfSummarizerTool />
      </div>
    </div>
  );
}

