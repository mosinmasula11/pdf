import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Free Online Developer & Utility Tools - JWT Debugger, Epoch & API Tools",
  description:
    "Fast, private online developer utilities: private JWT debugger, Unix epoch converter, URL encoder & query param editor, REST API client, API key generator, QR codes, and JSON formatter.",
  alternates: {
    canonical: "/utility-tools",
  },
  keywords: [
    "utility tools",
    "jwt debugger online",
    "unix timestamp converter",
    "epoch converter",
    "url encoder decoder",
    "api client",
    "api key generator",
    "qr code generator",
    "json formatter",
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
