import type { Metadata } from "next";
import { ToolGridCard } from "@/components/tools/ToolGridCard";
import { availableTools } from "@/lib/tool-registry";

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

      <div className="space-y-12">
        {Object.entries(
          availableTools.reduce<Record<string, typeof availableTools>>((acc, tool) => {
            acc[tool.category] ??= [];
            acc[tool.category].push(tool);
            return acc;
          }, {}),
        ).map(([category, tools]) => {
          const groups = tools.reduce<Record<string, typeof tools>>((acc, tool) => {
            const subcategory = tool.subcategory ?? category;
            acc[subcategory] ??= [];
            acc[subcategory].push(tool);
            return acc;
          }, {});

          return (
            <section key={category}>
              <h2 className="mb-5 text-2xl font-bold text-slate-900">{category}</h2>
              <div className="space-y-8">
                {Object.entries(groups).map(([subcategory, subcategoryTools]) => (
                  <section key={subcategory}>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                      {subcategory}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {subcategoryTools.map((tool) => <ToolGridCard key={tool.id} tool={tool} />)}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
