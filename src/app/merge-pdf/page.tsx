import type { Metadata } from "next";
import { MergePdfTool } from "@/components/tools/MergePdfTool";

export const metadata: Metadata = {
  title: "Merge PDF",
  description: "Merge multiple PDF files into one document without leaving your browser.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Merge PDF Files</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Combine multiple PDFs in the correct order and download the final document instantly.
      </p>
      <div className="mt-8">
        <MergePdfTool />
      </div>
    </div>
  );
}
