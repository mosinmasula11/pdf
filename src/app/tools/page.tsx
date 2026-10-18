import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toolRegistry } from "@/lib/tool-registry";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Browse all PDF, image and utility tools available on MSYN Tools.",
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Tool directory</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">All online tools</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {Object.entries(
          toolRegistry.reduce<Record<string, typeof toolRegistry>>((acc, tool) => {
            acc[tool.category] ??= [];
            acc[tool.category].push(tool);
            return acc;
          }, {}),
        ).map(([category, tools]) => (
          <div key={category} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">{category}</h2>
            <ul className="space-y-3">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <Link href={tool.path} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:border-violet-200 hover:bg-violet-50">
                    <span>{tool.name}</span>
                    <ArrowRight className="h-4 w-4 text-violet-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
