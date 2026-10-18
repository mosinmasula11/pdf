import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("signature-resizer");

export default function Page() {
  return <div className="mx-auto max-w-4xl px-4 py-12"><h1 className="text-4xl font-black text-slate-900">Signature Resizer</h1><p className="mt-4 text-lg text-slate-600">This signature utility is available for future enhancements.</p></div>;
}
