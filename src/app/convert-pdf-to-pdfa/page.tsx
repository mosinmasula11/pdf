import type { Metadata } from "next";
import { PdfToPdfaTool } from "@/components/tools/PdfToPdfaTool";

export const metadata: Metadata = {
  title: "Convert PDF to PDF/A Online",
  description: "Conform your PDF documents to PDF/A ISO archiving standards for long-term preservation.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to PDF/A</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Transform regular PDF documents into ISO-compliant PDF/A-1b archiving files with embedded metadata and device-independent color profiles.
      </p>
      <div className="mt-8">
        <PdfToPdfaTool />
      </div>
    </div>
  );
}

