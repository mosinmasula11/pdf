import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "MSYN Tools | Free PDF, Image & Utility Tools",
    template: "%s | MSYN Tools",
  },
  description: "Fast, free and private browser-based PDF, image and utility tools designed for everyday file workflows.",
  keywords: ["PDF tools", "image compressor", "resize image", "merge PDF", "online file tools"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo_for_title.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "MSYN Tools",
    description: "Free online tools for PDF conversion, image optimization and everyday file work.",
    type: "website",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
