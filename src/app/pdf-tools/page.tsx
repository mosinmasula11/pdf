import type { Metadata } from "next";
import { CategoryLandingPage } from "@/components/categories/CategoryLandingPage";

export const metadata: Metadata = {
  title: "PDF Tools",
  description: "Convert, merge, split, rotate and work with PDF documents using private file tools.",
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
