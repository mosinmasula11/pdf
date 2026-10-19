import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MSYN Tools - Free Online PDF & Image Tools",
    short_name: "MSYN Tools",
    description:
      "100% free, private browser-based PDF, image, and utility tools. Merge, split, compress, convert, edit and sign PDFs locally.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    categories: ["productivity", "utilities", "business"],
    lang: "en-US",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48 32x32 16x16",
        type: "image/x-icon",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Merge PDF",
        short_name: "Merge",
        description: "Combine multiple PDF files into one document",
        url: "/merge-pdf",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Compress PDF",
        short_name: "Compress",
        description: "Reduce PDF file size online",
        url: "/compress-pdf",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "JPG to PDF",
        short_name: "JPG to PDF",
        description: "Convert photos and images to PDF",
        url: "/jpg-to-pdf",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Resize Image to Custom KB",
        short_name: "Resize KB",
        description: "Target exact file size like 20KB or 50KB",
        url: "/resize-image-to-custom-kb",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
