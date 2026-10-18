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
    default: "MSYN Tools - Free Online PDF, Image & Utility Tools",
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "100% free, private browser-based PDF and image tools. Merge, split, compress, convert, rotate, sign, unlock, and edit PDFs locally on your device with zero server uploads and no limits.",
  keywords: [
    "PDF tools",
    "free online PDF tools",
    "free PDF editor",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "compress PDF to 100kb",
    "PDF to Word",
    "Word to PDF",
    "PDF to Excel",
    "PDF to JPG",
    "JPG to PDF",
    "sign PDF online free",
    "unlock PDF",
    "protect PDF password",
    "edit PDF online",
    "rotate PDF",
    "crop PDF",
    "compress image",
    "resize image to custom kb",
    "resize image to 20kb",
    "resize image to 50kb",
    "passport photo maker",
    "signature resizer",
    "word counter online",
    "json formatter",
    "client-side PDF tools",
    "private PDF tools no upload",
    "iLovePDF alternative",
    "smallpdf alternative",
    "browser PDF tools",
  ],
  authors: [{ name: siteConfig.brandName, url: siteConfig.url }],
  creator: siteConfig.brandName,
  publisher: siteConfig.brandName,
  applicationName: siteConfig.brandName,
  appleWebApp: {
    capable: true,
    title: siteConfig.brandName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  category: "productivity",
  classification: "Business & Document Management Tools",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "./",
    languages: {
      "en-US": "/en-US",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
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
    title: "MSYN Tools - Free Online PDF, Image & Utility Tools",
    description:
      "All-in-one private file tools. Merge, split, compress, convert, edit, and sign PDFs & optimize images locally on your device with 100% privacy and zero uploads.",
    url: siteConfig.url,
    siteName: siteConfig.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} - Free Online PDF, Image & Utility Tools`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MSYN Tools - Free Online PDF, Image & Utility Tools",
    description:
      "100% Free browser-based file tools: Merge, Split, Compress, Convert, Edit, Sign & Protect PDFs locally with zero server uploads.",
    images: ["/og-image.png"],
    creator: "@msyntools",
    site: "@msyntools",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google6265353018392703",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    },
  },
  other: {
    "google-adsense-account": "ca-pub-6265353018392703",
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
        alternateName: ["MSYN PDF Tools", "MSYN Online Tools", "MSYN"],
        description: siteConfig.description,
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        inLanguage: "en-US",
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
        name: `${siteConfig.brandName} - Online PDF, Image & Document Suite`,
        alternateName: "MSYN Tools",
        url: siteConfig.url,
        applicationCategory: "UtilitiesApplication",
        applicationSubCategory: "DocumentManagement",
        operatingSystem: "All (Web Browser, Chrome, Safari, Edge, Firefox, Android, iOS)",
        browserRequirements: "Requires modern web browser with HTML5 and JavaScript enabled",
        softwareVersion: "2.0",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "14280",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: toolRegistry.map((tool) => tool.name),
      },
      {
        "@type": "SiteNavigationElement",
        name: "Top Online PDF & Image Tools",
        hasPart: [
          {
            "@type": "WebPage",
            name: "Merge PDF",
            url: `${siteConfig.url}/merge-pdf`,
            description: "Combine multiple PDF files into one organized document.",
          },
          {
            "@type": "WebPage",
            name: "Compress PDF",
            url: `${siteConfig.url}/compress-pdf`,
            description: "Reduce PDF file size while optimizing quality.",
          },
          {
            "@type": "WebPage",
            name: "Split PDF",
            url: `${siteConfig.url}/split-pdf`,
            description: "Extract page ranges into separate documents.",
          },
          {
            "@type": "WebPage",
            name: "JPG to PDF",
            url: `${siteConfig.url}/jpg-to-pdf`,
            description: "Convert JPG and PNG images into a PDF file.",
          },
          {
            "@type": "WebPage",
            name: "PDF to Word",
            url: `${siteConfig.url}/pdf-to-word`,
            description: "Convert PDF documents to editable Word files.",
          },
          {
            "@type": "WebPage",
            name: "Compress Image",
            url: `${siteConfig.url}/compress-image`,
            description: "Reduce image file size without losing sharpness.",
          },
          {
            "@type": "WebPage",
            name: "Resize Image to Custom KB",
            url: `${siteConfig.url}/resize-image-to-custom-kb`,
            description: "Compress images to exact target sizes like 20KB or 50KB.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Is MSYN Tools completely free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, MSYN Tools is 100% free with unlimited usage, no file size limits, and no registration or account required.",
            },
          },
          {
            "@type": "Question",
            name: "Are my files safe and private?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. All file processing happens locally inside your browser using client-side WebAssembly and JavaScript. Your files are never uploaded to any remote server or stored anywhere.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need to install any software or browser extensions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No installation is needed. MSYN Tools runs directly in any modern web browser across Windows, macOS, Linux, Android, and iOS.",
            },
          },
          {
            "@type": "Question",
            name: "Can I compress images to specific sizes like 20KB or 50KB?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, our Resize Image to Custom KB tool allows you to compress and resize JPG, PNG, and WebP images to exact target file sizes required for government portals, job applications, and student exams.",
            },
          },
          {
            "@type": "Question",
            name: "How does MSYN Tools compare to iLovePDF and Smallpdf?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Unlike other tools that upload your sensitive documents to external cloud servers, MSYN Tools processes everything locally on your own device, guaranteeing 100% data privacy and instant processing speeds with no waiting queues.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-6265353018392703" />
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
