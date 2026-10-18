import type { Metadata } from "next";
import { JpgToPdfTool } from "@/components/tools/JpgToPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("jpg-to-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">JPG to PDF Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Combine one or more images into a single PDF without uploading your files to any remote server.
      </p>
      <div className="mt-8">
        <JpgToPdfTool />
      </div>
    </div>
  );
}
