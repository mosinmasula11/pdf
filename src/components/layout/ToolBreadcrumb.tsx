"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { toolRegistry } from "@/lib/tool-registry";
import { siteConfig } from "@/lib/site-config";

import { getToolStructuredData } from "@/lib/seo";

const categoryPaths = {
  "PDF Tools": "/pdf-tools",
  "Image Tools": "/image-tools",
  Utilities: "/utility-tools",
} as const;

export function ToolBreadcrumb() {
  const pathname = usePathname();
  const tool = toolRegistry.find((entry) => entry.path === pathname);

  if (!tool) return null;

  const toolStructuredData = getToolStructuredData(tool);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolStructuredData) }}
      />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li>
            <Link href="/" className="font-medium text-slate-500 hover:text-slate-800">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </li>
          <li>
            <Link href={categoryPaths[tool.category]} className="font-medium text-violet-700 hover:text-violet-900">
              {tool.category}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </li>
          <li aria-current="page" className="font-medium text-slate-600">
            {tool.name}
          </li>
        </ol>
      </nav>
    </>
  );
}
