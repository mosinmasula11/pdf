import type { Metadata } from "next";
import { ResizeImageToCustomKbTool } from "@/components/tools/ResizeImageToCustomKbTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("resize-image-to-custom-kb");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Resize Image to Custom KB</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Optimize your image to a target size such as 20KB, 50KB or 100KB for forms, job portals and student applications.
      </p>
      <div className="mt-8">
        <ResizeImageToCustomKbTool />
      </div>
    </div>
  );
}
