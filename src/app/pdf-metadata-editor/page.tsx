import type { Metadata } from "next";
import { PdfMetadataTool } from "@/components/tools/PdfMetadataTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pdf-metadata-editor");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF Metadata Editor</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Inspect, edit or wipe hidden metadata such as author, title, and creator tags for total document privacy.
      </p>
      <div className="mt-8">
        <PdfMetadataTool />
      </div>
    </div>
  );
}

