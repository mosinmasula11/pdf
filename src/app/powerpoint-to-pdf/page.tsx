import type { Metadata } from "next";
import { PowerpointToPdfTool } from "@/components/tools/PowerpointToPdfTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("powerpoint-to-pdf");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">POWERPOINT to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Turn your presentation slide decks (.pptx, .ppt) into clean, high-resolution PDF slides.
      </p>
      <div className="mt-8">
        <PowerpointToPdfTool />
      </div>
    </div>
  );
}

