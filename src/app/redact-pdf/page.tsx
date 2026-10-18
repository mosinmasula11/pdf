import type { Metadata } from "next";
import { RedactPdfTool } from "@/components/tools/RedactPdfTool";

export const metadata: Metadata = {
  title: "Redact PDF Online",
  description: "Permanently blackout sensitive text, personal info, and private graphics in your PDF documents.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Redact PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Blackout and securely remove private details, SSNs, credit card numbers, and confidential information from PDF files.
      </p>
      <div className="mt-8">
        <RedactPdfTool />
      </div>
    </div>
  );
}

