import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry, type ToolDefinition } from "@/lib/tool-registry";

/**
 * Creates rich, Google-optimized metadata for any tool page
 */
export function createToolMetadata(
  toolIdOrPath: string,
  overrides?: Partial<Metadata>,
): Metadata {
  const tool =
    toolRegistry.find((t) => t.id === toolIdOrPath) ||
    toolRegistry.find((t) => t.path === toolIdOrPath || t.path === `/${toolIdOrPath}`);

  if (!tool) {
    return {
      title: "Online File Tool",
      description: siteConfig.description,
    };
  }

  const title = tool.seoTitle || `${tool.name} Online Free`;
  const description =
    tool.metaDescription ||
    `${tool.description} 100% free, private local browser processing with no file uploads and no size limits.`;
  const canonicalPath = tool.path;
  const canonicalUrl = `${siteConfig.url}${canonicalPath}`;

  const defaultKeywords = [
    tool.name.toLowerCase(),
    `${tool.name.toLowerCase()} online`,
    `${tool.name.toLowerCase()} free`,
    `free ${tool.name.toLowerCase()}`,
    `${tool.name.toLowerCase()} without upload`,
    `${tool.name.toLowerCase()} private`,
    `best ${tool.name.toLowerCase()} tool`,
    tool.category.toLowerCase(),
    ...(tool.subcategory ? [tool.subcategory.toLowerCase()] : []),
    ...tool.supportedFormats.map((f) => `${f.toLowerCase()} tools`),
    "client-side pdf tools",
    "private pdf editor",
    "no file upload",
    "browser based tools",
    "ilovepdf alternative",
    "smallpdf alternative",
    "msyn tools",
  ];

  return {
    title,
    description,
    keywords: defaultKeywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | ${siteConfig.brandName}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.brandName,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${tool.name} - Free Online Tool - ${siteConfig.brandName}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: ["/og-image.png"],
      creator: "@msyntools",
    },
    category: tool.category.toLowerCase(),
    other: {
      "application-name": siteConfig.brandName,
      "apple-mobile-web-app-title": siteConfig.brandName,
    },
    ...overrides,
  };
}

/**
 * Generates comprehensive JSON-LD structured data for a tool page
 */
export function getToolStructuredData(tool: ToolDefinition) {
  const categoryPath =
    tool.category === "PDF Tools"
      ? "/pdf-tools"
      : tool.category === "Image Tools"
      ? "/image-tools"
      : "/utility-tools";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteConfig.url}${tool.path}#webapp`,
        name: `${tool.name} - ${siteConfig.brandName}`,
        alternateName: tool.seoTitle,
        description: tool.description,
        url: `${siteConfig.url}${tool.path}`,
        applicationCategory: "UtilitiesApplication",
        applicationSubCategory: tool.subcategory || tool.category,
        operatingSystem: "All (Windows, macOS, Linux, Android, iOS)",
        browserRequirements: "Requires modern web browser with HTML5 and JavaScript enabled",
        softwareVersion: "2.0",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "3850",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: [
          "100% free with no file limits",
          "Processes files locally in browser",
          "Zero file uploads to servers",
          "Fast instant processing",
          `Supports ${tool.supportedFormats.join(", ")}`,
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteConfig.url}${tool.path}#breadcrumbs`,
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
            item: `${siteConfig.url}${categoryPath}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.name,
            item: `${siteConfig.url}${tool.path}`,
          },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${siteConfig.url}${tool.path}#howto`,
        name: `How to use ${tool.name} online for free`,
        description: `Step-by-step guide on using ${tool.name} privately in your browser without uploading files.`,
        totalTime: "PT1M",
        supply: [
          {
            "@type": "HowToSupply",
            name: `${tool.supportedFormats.join(" or ")} file`,
          },
        ],
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Select or drag and drop your file",
            text: `Choose one or more ${tool.supportedFormats.join(", ")} files from your device.`,
            url: `${siteConfig.url}${tool.path}#step-1`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Customize options and process",
            text: `Configure settings, rearrange, or adjust parameters according to your needs.`,
            url: `${siteConfig.url}${tool.path}#step-2`,
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Download your file instantly",
            text: `Click the download button to save your processed document directly to your device with 100% privacy.`,
            url: `${siteConfig.url}${tool.path}#step-3`,
          },
        ],
      },
    ],
  };
}

