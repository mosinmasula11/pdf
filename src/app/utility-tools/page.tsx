import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Free Everyday Utility Tools - Word Counter & JSON Formatter",
  description:
    "Fast, private online utility helpers: count words, characters, and reading time in real time, or format, validate, and minify JSON directly in your browser.",
  alternates: {
    canonical: "/utility-tools",
  },
  keywords: [
    "utility tools",
    "word counter online",
    "character counter",
    "reading time calculator",
    "json formatter",
    "json validator",
    "developer tools",
  ],
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
