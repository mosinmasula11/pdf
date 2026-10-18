import type { Metadata } from "next";
import { WebpToJpgTool } from "@/components/tools/WebpToJpgTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("webp-to-jpg");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">WebP to JPG Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Convert Google WebP images into widely supported JPG or PNG formats locally in your browser.
      </p>
      <div className="mt-8">
        <WebpToJpgTool />
      </div>
    </div>
  );
}

