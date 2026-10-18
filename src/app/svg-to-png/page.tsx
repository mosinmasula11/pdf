import type { Metadata } from "next";
import { SvgToPngTool } from "@/components/tools/SvgToPngTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("svg-to-png");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">SVG to PNG / JPG Converter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Convert vector SVG graphics into crisp, high-resolution PNG, JPG, or WebP images with transparent backgrounds and custom scaling.
      </p>
      <div className="mt-8">
        <SvgToPngTool />
      </div>
    </div>
  );
}

