import type { Metadata } from "next";
import { FlattenPdfTool } from "@/components/tools/FlattenPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("flatten-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Flatten PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Lock all interactive form fields, checkboxes, and annotations into permanent, non-editable page content.
      </p>
      <div className="mt-8">
        <FlattenPdfTool />
      </div>
    </div>
  );
}

