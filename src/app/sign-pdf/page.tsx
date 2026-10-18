import type { Metadata } from "next";
import { SignPdfTool } from "@/components/tools/SignPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("sign-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Sign PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Sign documents yourself with a drawn signature, typed cursive script, or uploaded signature image.
      </p>
      <div className="mt-8">
        <SignPdfTool />
      </div>
    </div>
  );
}

