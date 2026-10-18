import type { Metadata } from "next";
import { BackgroundRemoverTool } from "@/components/tools/BackgroundRemoverTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("remove-background");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Remove Image Background</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Instantly remove backgrounds from photos, logos, product graphics, and signatures. Download high-resolution transparent PNGs or replace with custom colors.
      </p>
      <div className="mt-8">
        <BackgroundRemoverTool />
      </div>
    </div>
  );
}

