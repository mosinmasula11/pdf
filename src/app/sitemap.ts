import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";

const highPriorityToolPaths = new Set([
  "/merge-pdf",
  "/split-pdf",
  "/compress-pdf",
  "/jpg-to-pdf",
  "/pdf-to-jpg",
  "/word-to-pdf",
  "/pdf-to-word",
  "/rotate-pdf",
  "/sign-pdf",
  "/protect-pdf",
  "/unlock-pdf",
  "/compress-image",
  "/resize-image",
  "/resize-image-to-custom-kb",
  "/passport-photo-maker",
  "/webp-to-jpg",
  "/remove-background",
  "/qr-code-generator",
  "/password-generator",
  "/api-client",
  "/api-key-generator",
]);

const categoryPaths = new Set([
  "/tools",
  "/pdf-tools",
  "/image-tools",
  "/utility-tools",
]);

const informationalPaths = new Set([
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    ...Array.from(categoryPaths),
    ...toolRegistry.map((tool) => tool.path),
    ...Array.from(informationalPaths),
  ];

  const now = new Date();

  return routes.map((route) => {
    let priority = 0.8;
    let changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly";

    if (route === "") {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (categoryPaths.has(route)) {
      priority = 0.9;
      changeFrequency = "daily";
    } else if (highPriorityToolPaths.has(route)) {
      priority = 0.95;
      changeFrequency = "daily";
    } else if (informationalPaths.has(route)) {
      priority = 0.5;
      changeFrequency = "monthly";
    }

    return {
      url: `${siteConfig.url}${route}`,
      lastModified: now,
      changeFrequency,
      priority,
    };
  });
}
