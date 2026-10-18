export const siteConfig = {
  brandName: "Maargre Tools",
  shortName: "Maargre",
  tagline: "Free online PDF, image and file tools",
  description:
    "Compress, convert, resize and manage your files locally in your browser with fast, private and free online tools.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://maargre.example",
  locale: "en-US",
  categories: [
    { name: "PDF Tools", slug: "pdf-tools" },
    { name: "Image Tools", slug: "image-tools" },
    { name: "Utilities", slug: "utilities" },
  ],
};
