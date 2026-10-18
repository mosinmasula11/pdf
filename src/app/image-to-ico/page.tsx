import type { Metadata } from "next";
import { ImageToIcoTool } from "@/components/tools/ImageToIcoTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("image-to-ico");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Image to ICO & Favicon Generator</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Convert PNG, JPG, SVG, and WebP into multi-resolution Windows .ico icons and website favicon packages 100% in your browser.
      </p>
      <div className="mt-8">
        <ImageToIcoTool />
      </div>
    </div>
  );
}

