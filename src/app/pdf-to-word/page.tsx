import type { Metadata } from "next";
import { PdfToWordTool } from "@/components/tools/PdfToWordTool";

export const metadata: Metadata = {
  title: "PDF to Word Converter Online",
  description: "Convert PDF documents into fully editable Microsoft Word (.docx) files without uploading to servers.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to WORD</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Turn your PDF documents into editable Word (.docx) files with paragraphs, headings, and formatting preserved.
      </p>
      <div className="mt-8">
        <PdfToWordTool />
      </div>
    </div>
  );
}

