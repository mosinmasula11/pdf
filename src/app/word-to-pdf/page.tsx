import type { Metadata } from "next";
import { WordToPdfTool } from "@/components/tools/WordToPdfTool";

export const metadata: Metadata = {
  title: "Word to PDF Converter Online",
  description: "Convert Word DOCX documents into clean, professional PDF files directly in your browser.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Word to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Turn Microsoft Word (.docx, .doc) files into print-ready PDF documents without uploading to servers.
      </p>
      <div className="mt-8">
        <WordToPdfTool />
      </div>
    </div>
  );
}

