import type { Metadata } from "next";
import { PdfToMarkdownTool } from "@/components/tools/PdfToMarkdownTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-to-markdown");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to Markdown</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Transform PDF documents into formatted Markdown syntax ready for documentation, GitHub, or note-taking apps.
      </p>
      <div className="mt-8">
        <PdfToMarkdownTool />
      </div>
    </div>
  );
}

