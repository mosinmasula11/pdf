import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Free Online Image Tools - Convert, Compress, Resize & Favicon Generator",
  description:
    "Convert images to ICO, PNG, JPG, WebP, SVG rasterization, compress and resize images to custom KB sizes (20KB, 50KB, 100KB) for forms, portals, and web apps locally in your browser.",
  alternates: {
    canonical: "/image-tools",
  },
  keywords: [
    "image tools",
    "image to ico converter",
    "favicon generator",
    "svg to png converter",
    "image format converter",
    "compress image online",
    "resize image to custom kb",
    "passport photo maker",
    "signature resizer",
  ],
};

export default function ImageToolsPage() {
  return (
    <CategoryLandingPage
      category="Image Tools"
      title="Image tools made simple"
      description="Resize image dimensions, target a specific file size and compress common image formats without uploading your files."
      image="/images/categories/image-tools.png"
      accent="sky"
    />
  );
}
