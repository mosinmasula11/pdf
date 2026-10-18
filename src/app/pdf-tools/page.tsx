import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "Free Online PDF Tools - Merge, Split, Compress & Edit PDFs",
  description:
    "Every tool you need to work with PDF documents in one place. Merge, split, compress, convert, rotate, sign, unlock, and edit PDFs locally in your browser for free.",
  alternates: {
    canonical: "/pdf-tools",
  },
  keywords: [
    "pdf tools",
    "free pdf tools",
    "online pdf editor",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "pdf converter",
    "sign pdf",
  ],
};

export default function PdfToolsPage() {
  return (
    <CategoryLandingPage
      category="PDF Tools"
      title="PDF tools for everyday documents"
      description="Convert images to PDF, merge documents, extract page ranges, rotate pages or export PDF pages as images."
      image="/images/categories/pdf-tools.png"
      accent="rose"
    />
  );
}
