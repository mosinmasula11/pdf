import type { Metadata } from "next";
import { HtmlToPdfTool } from "@/components/tools/HtmlToPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("html-to-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">HTML to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Transform HTML markup, templates, or webpage layouts into clean, printable PDF documents.
      </p>
      <div className="mt-8">
        <HtmlToPdfTool />
      </div>
    </div>
  );
}

