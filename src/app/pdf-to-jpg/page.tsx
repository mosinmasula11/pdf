import type { Metadata } from "next";
import { PdfToJpgTool } from "@/components/tools/PdfToJpgTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-to-jpg");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to JPG Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Extract each page from a PDF as a JPG image and save them as a convenient batch download.
      </p>
      <div className="mt-8">
        <PdfToJpgTool />
      </div>
    </div>
  );
}
