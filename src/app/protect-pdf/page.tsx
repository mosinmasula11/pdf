import type { Metadata } from "next";
import { ProtectPdfTool } from "@/components/tools/ProtectPdfTool";

export const metadata: Metadata = {
  title: "Protect PDF Online",
  description: "Encrypt your PDF documents with secure password protection and permissions control.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Protect PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Password-protect sensitive PDF documents and restrict unauthorized printing, copying, or tampering.
      </p>
      <div className="mt-8">
        <ProtectPdfTool />
      </div>
    </div>
  );
}

