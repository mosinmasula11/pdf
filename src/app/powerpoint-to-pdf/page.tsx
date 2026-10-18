import type { Metadata } from "next";
import { PowerpointToPdfTool } from "@/components/tools/PowerpointToPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("powerpoint-to-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">POWERPOINT to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Export text from PPTX slides into a simple PDF presentation. Original artwork and slide layouts are not preserved.
      </p>
      <div className="mt-8">
        <PowerpointToPdfTool />
      </div>
    </div>
  );
}

