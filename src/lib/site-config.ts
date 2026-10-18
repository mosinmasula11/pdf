export const siteConfig = {
  brandName: "MSYN Tools",
  shortName: "MSYN",
  tagline: "Free online PDF, image and file tools",
  description:
    "Compress, convert, resize and manage your files locally in your browser with fast, private and free online tools.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://pdf.msyn.in",
  mainSiteUrl: "https://msyn.in",
  supportEmail: "support@msyn.in",
  techEmail: "tech.msyn@gmail.com",
  locale: "en-US",
  categories: [
    { name: "PDF Tools", slug: "pdf-tools" },
    { name: "Image Tools", slug: "image-tools" },
    { name: "Utility Tools", slug: "utility-tools" },
  ],
};
