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
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" aria-label={`${siteConfig.brandName} home`} className="mb-4 inline-flex">
            <Image
              src="/branding/msyn-tools-logo-dark.png"
              alt={siteConfig.brandName}
              width={1193}
              height={400}
              className="h-auto w-56"
            />
          </Link>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Free and private browser-first file tools for PDFs, images and daily utility workflows. Part of the{" "}
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

          <div className="mt-4 space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-violet-400" />
              <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-white">
                {siteConfig.supportEmail}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              <a href={`mailto:${siteConfig.techEmail}`} className="hover:text-white">
                {siteConfig.techEmail}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <a href={siteConfig.mainSiteUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                msyn.in
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Company</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            {navigation.slice(0, 4).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            {navigation.slice(4).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 {siteConfig.brandName} (<a href={siteConfig.url} className="hover:underline text-slate-400">{siteConfig.url.replace(/^https?:\/\//, "")}</a>). All rights reserved.</span>
          <span>Made for private local file processing.</span>
        </div>
      </div>
    </footer>
  );
}
