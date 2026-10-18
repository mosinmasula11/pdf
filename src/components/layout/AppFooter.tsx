import Link from "next/link";
import Image from "next/image";
import { Mail, Globe } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const navigation = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/pdf-tools", label: "PDF Tools" },
  { href: "/image-tools", label: "Image Tools" },
  { href: "/utility-tools", label: "Utility Tools" },
  { href: "/tools", label: "All Tools" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export function AppFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand Info & Contacts */}
          <div className="col-span-4 lg:col-span-1">
            <Link href="/" aria-label={`${siteConfig.brandName} home`} className="mb-2.5 inline-flex">
              <Image
                src="/branding/msyn-tools-logo-dark.png"
                alt={siteConfig.brandName}
                width={1193}
                height={400}
                className="h-auto w-36 sm:w-48"
              />
            </Link>
            <p className="max-w-sm text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
              Free, private browser-first file tools for PDFs, images, and developer workflows. Part of the{" "}
              <a
                href={siteConfig.mainSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
              >
                msyn.in
              </a>{" "}
              network.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-slate-400 sm:text-xs">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-violet-400" />
                <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-white">
                  {siteConfig.supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-sky-400" />
                <a href={`mailto:${siteConfig.techEmail}`} className="hover:text-white">
                  {siteConfig.techEmail}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 shrink-0 text-emerald-400" />
                <a href={siteConfig.mainSiteUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                  msyn.in
                </a>
              </div>
            </div>
          </div>

          {/* Col 1: PDF Tools */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-xs">
              PDF Tools
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-400 sm:space-y-2 sm:text-xs">
              <li><Link href="/pdf-tools" className="transition hover:text-white">All PDF Tools</Link></li>
              <li><Link href="/merge-pdf" className="transition hover:text-white">Merge PDF</Link></li>
              <li><Link href="/split-pdf" className="transition hover:text-white">Split PDF</Link></li>
              <li><Link href="/compress-pdf" className="transition hover:text-white">Compress PDF</Link></li>
              <li><Link href="/flatten-pdf" className="transition hover:text-white">Flatten PDF</Link></li>
            </ul>
          </div>

          {/* Col 2: Image Tools */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-xs">
              Image Tools
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-400 sm:space-y-2 sm:text-xs">
              <li><Link href="/image-tools" className="transition hover:text-white">All Image Tools</Link></li>
              <li><Link href="/image-to-ico" className="transition hover:text-white">Image to ICO</Link></li>
              <li><Link href="/svg-to-png" className="transition hover:text-white">SVG to PNG</Link></li>
              <li><Link href="/image-converter" className="transition hover:text-white">Image Converter</Link></li>
              <li><Link href="/compress-image" className="transition hover:text-white">Compress Image</Link></li>
              <li><Link href="/webp-to-jpg" className="transition hover:text-white">WebP to JPG</Link></li>
            </ul>
          </div>

          {/* Col 3: Utilities */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-xs">
              Utilities
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-400 sm:space-y-2 sm:text-xs">
              <li><Link href="/utility-tools" className="transition hover:text-white">All Utilities</Link></li>
              <li><Link href="/jwt-debugger" className="transition hover:text-white">JWT Debugger</Link></li>
              <li><Link href="/epoch-converter" className="transition hover:text-white">Unix Epoch</Link></li>
              <li><Link href="/url-converter" className="transition hover:text-white">URL Encoder</Link></li>
              <li><Link href="/api-key-generator" className="transition hover:text-white">API Key Gen</Link></li>
              <li><Link href="/qr-code-generator" className="transition hover:text-white">QR Code</Link></li>
              <li><Link href="/api-client" className="transition hover:text-white">REST API Client</Link></li>
            </ul>
          </div>

          {/* Col 4: Company */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-xs">
              Company
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-400 sm:space-y-2 sm:text-xs">
              <li><Link href="/about" className="transition hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="transition hover:text-white">Contact</Link></li>
              <li><Link href="/privacy-policy" className="transition hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition hover:text-white">Terms</Link></li>
              <li><Link href="/cookie-policy" className="transition hover:text-white">Cookies</Link></li>
              <li><Link href="/sitemap.xml" className="transition hover:text-white">Sitemap</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 {siteConfig.brandName} (<a href={siteConfig.url} className="hover:underline text-slate-400">{siteConfig.url.replace(/^https?:\/\//, "")}</a>). All rights reserved.</span>
          <span>Made for private local file processing.</span>
        </div>
      </div>
    </footer>
  );
}
