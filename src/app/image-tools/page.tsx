import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Free Online Image Tools - Compress, Resize & Passport Photos",
  description:
    "Optimize, compress and resize JPG, PNG and WebP images to custom KB sizes (20KB, 50KB, 100KB) for exam forms, passport applications and portals locally in your browser.",
  alternates: {
    canonical: "/image-tools",
  },
  keywords: [
    "image tools",
    "compress image online",
    "resize image to custom kb",
    "resize image to 20kb",
    "resize image to 50kb",
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
