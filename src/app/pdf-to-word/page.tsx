import type { Metadata } from "next";
import { PdfToWordTool } from "@/components/tools/PdfToWordTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-to-word");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to WORD</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Extract selectable PDF text into editable Word files. Original images and page layouts are not preserved.
      </p>
      <div className="mt-8">
        <PdfToWordTool />
      </div>
    </div>
  );
}

