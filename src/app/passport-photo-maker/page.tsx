import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { ImagePresetTool } from "@/components/tools/ImagePresetTool";
export const metadata: Metadata = createToolMetadata("pass-photo-maker");
export default function Page() {
  return <div className="mx-auto max-w-4xl px-4 py-12"><h1 className="mb-6 text-4xl font-black text-slate-900">Passport Photo Maker</h1><ImagePresetTool kind="passport" /></div>;
}
