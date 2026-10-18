import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  rewrites: async () => {
    return [
      { source: "/merge_pdf", destination: "/merge-pdf" },
      { source: "/split_pdf", destination: "/split-pdf" },
      { source: "/compress_pdf", destination: "/compress-pdf" },
      { source: "/repair_pdf", destination: "/repair-pdf" },
      { source: "/ocr_pdf", destination: "/ocr-pdf" },
      { source: "/jpg_to_pdf", destination: "/jpg-to-pdf" },
      { source: "/word_to_pdf", destination: "/word-to-pdf" },
      { source: "/powerpoint_to_pdf", destination: "/powerpoint-to-pdf" },
      { source: "/excel_to_pdf", destination: "/excel-to-pdf" },
      { source: "/html_to_pdf", destination: "/html-to-pdf" },
      { source: "/pdf_to_jpg", destination: "/pdf-to-jpg" },
      { source: "/pdf_to_word", destination: "/pdf-to-word" },
      { source: "/pdf_to_powerpoint", destination: "/pdf-to-powerpoint" },
      { source: "/pdf_to_excel", destination: "/pdf-to-excel" },
      { source: "/convert-pdf-to-pdfa", destination: "/convert-pdf-to-pdfa" },
      { source: "/pdf-to-pdfa", destination: "/convert-pdf-to-pdfa" },
      { source: "/rotate_pdf", destination: "/rotate-pdf" },
      { source: "/add_pdf_page_number", destination: "/add-page-numbers" },
      { source: "/pdf_add_watermark", destination: "/add-watermark" },
      { source: "/unlock_pdf", destination: "/unlock-pdf" },
      { source: "/protect_pdf", destination: "/protect-pdf" },
      { source: "/sign_pdf", destination: "/sign-pdf" },
      { source: "/redact_pdf", destination: "/redact-pdf" },
      { source: "/compare_pdf", destination: "/compare-pdf" },
      { source: "/pdf_summarize", destination: "/pdf-summarize" },
      { source: "/translate_pdf", destination: "/translate-pdf" },
      { source: "/pdf_to_markdown", destination: "/pdf-to-markdown" },
    ];
  },
};

export default nextConfig;
