import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Utility Tools",
  description: "Use quick browser-based helpers for text analysis and JSON formatting.",
};

export default function UtilityToolsPage() {
  return (
    <CategoryLandingPage
      category="Utilities"
      title="Useful everyday utilities"
      description="Quickly count and analyze text or format and validate JSON with lightweight tools that run in your browser."
      image="/images/categories/utility-tools.png"
      accent="violet"
    />
  );
}
