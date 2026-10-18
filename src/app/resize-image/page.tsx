import type { Metadata } from "next";
import { ResizeImageTool } from "@/components/tools/ResizeImageTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("resize-image");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Resize Image</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Change image dimensions to match social posts, portal uploads or any design layout.</p>
      <div className="mt-8"><ResizeImageTool /></div>
    </div>
  );
}
