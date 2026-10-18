import type { Metadata } from "next";
import { SplitPdfTool } from "@/components/tools/SplitPdfTool";

export const metadata: Metadata = {
  title: "Split PDF",
  description: "Extract a page range from a PDF and save it as a separate file.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Split PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Select a page range to reduce a large PDF into a smaller document.</p>
      <div className="mt-8"><SplitPdfTool /></div>
    </div>
  );
}
