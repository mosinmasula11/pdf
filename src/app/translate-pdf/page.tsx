import type { Metadata } from "next";
import { TranslatePdfTool } from "@/components/tools/TranslatePdfTool";

export const metadata: Metadata = {
  title: "Translate PDF Online",
  description: "Translate PDF documents to Spanish, French, German, Hindi, Chinese and other languages.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Translate PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Extract and translate PDF content into global languages with a side-by-side bilingual view.
      </p>
      <div className="mt-8">
        <TranslatePdfTool />
      </div>
    </div>
  );
}

