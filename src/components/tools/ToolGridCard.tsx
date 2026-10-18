import Link from "next/link";
import type { ToolDefinition } from "@/lib/tool-registry";
import { getToolIcon } from "@/lib/tool-icons";

const categoryStyles: Record<ToolDefinition["category"], string> = {
  "PDF Tools": "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
  "Image Tools": "bg-sky-50 text-sky-600 group-hover:bg-sky-100",
  Utilities: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
};

export function ToolGridCard({
  tool,
}: { tool: ToolDefinition }) {
  const Icon = getToolIcon(tool.id);

  return (
    <Link
      href={tool.path}
      className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition ${categoryStyles[tool.category]}`}
      >
        <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 font-semibold leading-5 text-slate-900">
          {tool.name}
          {tool.status === "beta" && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Beta
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-4 text-slate-500 line-clamp-2">
          {tool.description}
        </span>
      </span>
    </Link>
  );
}
