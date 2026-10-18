import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("pass-photo-maker");

export default function Page() {
  return <div className="mx-auto max-w-4xl px-4 py-12"><h1 className="text-4xl font-black text-slate-900">Passport Photo Maker</h1><p className="mt-4 text-lg text-slate-600">This local passport photo utility is under construction.</p></div>;
}
