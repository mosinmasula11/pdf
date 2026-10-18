import type { Metadata } from "next";
import { CompressPdfTool } from "@/components/tools/CompressPdfTool";

export const metadata: Metadata = {
  title: "Compress PDF Online",
  description: "Reduce PDF file size while retaining the best possible document and image quality.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Compress PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Shrink large PDF documents quickly and securely right in your browser.
      </p>
      <div className="mt-8">
        <CompressPdfTool />
      </div>
    </div>
  );
}

