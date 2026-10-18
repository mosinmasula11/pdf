import type { Metadata } from "next";
import { WordToPdfTool } from "@/components/tools/WordToPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("word-to-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Word to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Export text from DOCX and TXT files into simple PDF documents locally. Original layout and images are not preserved.
      </p>
      <div className="mt-8">
        <WordToPdfTool />
      </div>
    </div>
  );
}

