import type { Metadata } from "next";
import { ComparePdfTool } from "@/components/tools/ComparePdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("compare-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Compare PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Easily compare two versions of a PDF document to quickly review modifications, deletions, and additions.
      </p>
      <div className="mt-8">
        <ComparePdfTool />
      </div>
    </div>
  );
}

