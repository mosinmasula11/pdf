import type { Metadata } from "next";
import { WordCounterTool } from "@/components/tools/WordCounterTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("word-counter");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Word Counter</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Paste any text and instantly measure word count, character count and sentence structure.</p>
      <div className="mt-8"><WordCounterTool /></div>
    </div>
  );
}
