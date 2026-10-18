import type { Metadata } from "next";
import { PdfFormsTool } from "@/components/tools/PdfFormsTool";

export const metadata: Metadata = {
  title: "Fill PDF Forms Online",
  description: "Fill interactive PDF forms, check boxes, select dropdowns, and download completed documents.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF Forms</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Easily fill out PDF forms, check boxes, input text fields, and flatten completed files.
      </p>
      <div className="mt-8">
        <PdfFormsTool />
      </div>
    </div>
  );
}

