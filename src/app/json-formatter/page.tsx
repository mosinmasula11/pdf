import type { Metadata } from "next";
import { JsonFormatterTool } from "@/components/tools/JsonFormatterTool";

export const metadata: Metadata = {
  title: "JSON Formatter",
  description: "Format, validate and minify JSON data locally in the browser.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">JSON Formatter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Paste JSON and get a clean, validated result with a quick format or compact minify action.</p>
      <div className="mt-8"><JsonFormatterTool /></div>
    </div>
  );
}
