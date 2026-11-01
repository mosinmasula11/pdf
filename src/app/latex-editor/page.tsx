import type { Metadata } from "next";
import { LatexEditorTool } from "@/components/tools/LatexEditorTool";
import { createToolMetadata } from "@/lib/seo";
export const metadata: Metadata = createToolMetadata("latex-editor");
export default function Page() {
  return <div className="mx-auto max-w-[1720px] px-3 py-6 sm:px-6 lg:px-8"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-700">MSYN Tools / Writing studio</p><h1 className="text-2xl font-semibold tracking-tight text-slate-900">LaTeX Editor</h1><p className="mt-1 text-sm text-slate-500">A quiet space for your next paper, report, or big idea.</p></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-800">Free workspace · No account needed</span></div><LatexEditorTool /></div>;
}
