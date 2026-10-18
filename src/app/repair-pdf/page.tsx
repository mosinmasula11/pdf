import type { Metadata } from "next";
import { RepairPdfTool } from "@/components/tools/RepairPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("repair-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Repair PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Reconstruct and recover damaged PDF documents and cross-reference tables safely and privately.
      </p>
      <div className="mt-8">
        <RepairPdfTool />
      </div>
    </div>
  );
}

