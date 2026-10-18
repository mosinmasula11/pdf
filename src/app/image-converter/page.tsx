import type { Metadata } from "next";
import { ImageConverterTool } from "@/components/tools/ImageConverterTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("image-converter");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Image Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Convert images between PNG, JPG, and WebP formats in batch with custom quality control and 100% browser privacy.
      </p>
      <div className="mt-8">
        <ImageConverterTool />
      </div>
    </div>
  );
}

