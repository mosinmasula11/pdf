import type { Metadata } from "next";
import { UrlConverterTool } from "@/components/tools/UrlConverterTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("url-converter");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">URL Encoder / Decoder & Query Param Editor</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        Inspect and edit URL query parameters visually in real time, or encode and decode URI components safely in your browser.
      </p>
      <div className="mt-8">
        <UrlConverterTool />
      </div>
    </div>
  );
}

