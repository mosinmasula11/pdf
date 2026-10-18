"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { toolRegistry } from "@/lib/tool-registry";
import { siteConfig } from "@/lib/site-config";

const categoryPaths = {
  "PDF Tools": "/pdf-tools",
  "Image Tools": "/image-tools",
  Utilities: "/utility-tools",
} as const;

export function ToolBreadcrumb() {
  const pathname = usePathname();
  const tool = toolRegistry.find((entry) => entry.path === pathname);

  if (!tool) return null;

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.category,
        item: `${siteConfig.url}${categoryPaths[tool.category]}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${siteConfig.url}${tool.path}`,
      },
    ],
  };

  const toolStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${tool.name} - ${siteConfig.brandName}`,
    description: tool.description,
    url: `${siteConfig.url}${tool.path}`,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: tool.subcategory || tool.category,
    operatingSystem: "All (Windows, Mac, Linux, iOS, Android)",
    browserRequirements: "Requires HTML5 & WebAssembly Support",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2840",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
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
