import type { Metadata } from "next";
import { UnlockPdfTool } from "@/components/tools/UnlockPdfTool";

export const metadata: Metadata = {
  title: "Unlock PDF Online",
  description: "Remove PDF passwords, security locks, and printing/copying restrictions instantly.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Unlock PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Remove owner restrictions, printing limitations, and password protections from your PDF files.
      </p>
      <div className="mt-8">
        <UnlockPdfTool />
      </div>
    </div>
  );
}

