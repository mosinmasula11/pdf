import type { Metadata } from "next";
import { RotatePdfTool } from "@/components/tools/RotatePdfTool";

export const metadata: Metadata = {
  title: "Rotate PDF",
  description: "Rotate all pages in a PDF to a chosen angle in the browser.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Rotate PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Rotate your document by 90°, 180° or 270° while keeping the PDF content intact.</p>
      <div className="mt-8"><RotatePdfTool /></div>
    </div>
  );
}
