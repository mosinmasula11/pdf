import type { Metadata } from "next";
import { ImageCompressorTool } from "@/components/tools/ImageCompressorTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("compress-image");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Compress Image Online</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Optimize JPG, PNG and WebP images for quicker sharing, smaller file sizes and faster uploads.
      </p>
      <div className="mt-8">
        <ImageCompressorTool />
      </div>
    </div>
  );
}
