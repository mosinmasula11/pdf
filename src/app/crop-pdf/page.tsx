import type { Metadata } from "next";
import { CropPdfTool } from "@/components/tools/CropPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("crop-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Crop PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Trim unnecessary margins, headers, or footers from your PDF document easily.
      </p>
      <div className="mt-8">
        <CropPdfTool />
      </div>
    </div>
  );
}

