import type { Metadata } from "next";
import { OcrPdfTool } from "@/components/tools/OcrPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("ocr-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">OCR PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Extract selectable, searchable text from PDF documents and export to TXT or searchable PDF.
      </p>
      <div className="mt-8">
        <OcrPdfTool />
      </div>
    </div>
  );
}
