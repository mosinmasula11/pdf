import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Image Tools",
  description: "Compress and resize images locally in your browser with privacy-first image tools.",
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
