import type { Metadata } from "next";
import { AddWatermarkTool } from "@/components/tools/AddWatermarkTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("add-watermark");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Add Watermark to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Stamp custom text or brand logos with transparency, rotation, and custom positioning over every PDF page.
      </p>
      <div className="mt-8">
        <AddWatermarkTool />
      </div>
    </div>
  );
}

