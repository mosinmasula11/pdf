import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "MSYN Tools | Free Online PDF, Image & Utility Tools",
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Free, fast and private browser-based PDF and image tools. Merge, split, compress, convert, rotate, unlock, sign, and edit PDFs locally on your device with 100% privacy.",
  keywords: [
    "PDF tools",
    "free PDF editor",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF to Word",
    "Word to PDF",
    "PDF to Excel",
    "PDF to JPG",
    "sign PDF",
    "unlock PDF",
    "protect PDF",
    "edit PDF",
    "image compressor",
    "resize image",
    "iLovePDF alternative",
    "browser PDF tools",
  ],
  authors: [{ name: siteConfig.brandName, url: siteConfig.url }],
  creator: siteConfig.brandName,
  publisher: siteConfig.brandName,
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo_for_title.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "MSYN Tools | Free Online PDF, Image & Utility Tools",
    description:
      "Every tool you need to work with PDFs and images in one place. 100% free, private, and client-side.",
    url: siteConfig.url,
    siteName: siteConfig.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} - Free Online PDF & Image Tools`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MSYN Tools | Free Online PDF, Image & Utility Tools",
    description:
      "Free browser-based PDF tools: Merge, Split, Compress, Convert, Edit, Sign & Protect PDFs locally with zero server uploads.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const globalStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.brandName,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          "@id": `${siteConfig.url}/#logo`,
          url: `${siteConfig.url}/branding/msyn-tools-logo.png`,
          caption: siteConfig.brandName,
        },
        sameAs: [siteConfig.mainSiteUrl],
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: siteConfig.supportEmail,
            contactType: "Customer Support",
            availableLanguage: ["English"],
          },
          {
            "@type": "ContactPoint",
            email: siteConfig.techEmail,
            contactType: "Technical Support",
            availableLanguage: ["English"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.brandName,
        description: siteConfig.description,
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/tools?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteConfig.url}/#application`,
        name: `${siteConfig.brandName} - Online PDF & Document Suite`,
        url: siteConfig.url,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "DocumentManagement",
        operatingSystem: "All (Web Browser, Chrome, Safari, Edge, Firefox)",
        browserRequirements: "Requires HTML5 & JavaScript enabled",
        softwareVersion: "2.0",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "14280",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: toolRegistry.map((tool) => tool.name),
      },
    ],
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalStructuredData) }}
        />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
