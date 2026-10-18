import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const navigation = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/tools", label: "All Tools" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-500 text-lg font-bold text-white">
              M
            </div>
            <div className="text-xl font-semibold text-slate-900">{siteConfig.brandName}</div>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-600">
            Free and private browser-first file tools for PDFs, images and daily utility workflows.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Company</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {navigation.slice(0, 4).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-violet-700">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Explore</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {navigation.slice(4).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-violet-700">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 {siteConfig.brandName}. All rights reserved.</span>
          <span>Made for private local file processing.</span>
        </div>
      </div>
    </footer>
  );
}
