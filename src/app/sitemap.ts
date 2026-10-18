import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/tools",
    "/pdf-tools",
    "/image-tools",
    "/utility-tools",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
    ...toolRegistry.map((tool) => tool.path),
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
