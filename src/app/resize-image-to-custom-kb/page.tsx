import type { Metadata } from "next";
import { ResizeImageToCustomKbTool } from "@/components/tools/ResizeImageToCustomKbTool";

export const metadata: Metadata = {
  title: "Resize Image to Custom KB",
  description: "Reduce any image to a precise file size such as 20KB, 100KB or 500KB in the browser.",
};

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
