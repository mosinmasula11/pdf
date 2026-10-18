import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { ImagePresetTool } from "@/components/tools/ImagePresetTool";
export const metadata: Metadata = createToolMetadata("signature-resizer");
export default function Page() {
  return <div className="mx-auto max-w-4xl px-4 py-12"><h1 className="mb-6 text-4xl font-black text-slate-900">Signature Resizer</h1><ImagePresetTool kind="signature" /></div>;
}
