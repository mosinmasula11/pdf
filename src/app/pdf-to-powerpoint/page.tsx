import type { Metadata } from "next";
import { PdfToPowerpointTool } from "@/components/tools/PdfToPowerpointTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-to-powerpoint");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to POWERPOINT</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Turn your PDF documents into presentation slides ready to open and present in PowerPoint or Google Slides.
      </p>
      <div className="mt-8">
        <PdfToPowerpointTool />
      </div>
    </div>
  );
}

