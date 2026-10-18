import type { Metadata } from "next";
import { OrganizePdfTool } from "@/components/tools/OrganizePdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("organize-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Organize PDF Pages</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Visually sort, reorder, rotate, or delete pages in your PDF file with drag-and-drop ease.
      </p>
      <div className="mt-8">
        <OrganizePdfTool />
      </div>
    </div>
  );
}

