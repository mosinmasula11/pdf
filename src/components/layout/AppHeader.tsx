import Link from "next/link";
import Image from "next/image";
import { Menu, Search } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label={`${siteConfig.brandName} home`} className="flex shrink-0 items-center">
          <Image
            src="/branding/msyn-tools-logo.png"
            alt={siteConfig.brandName}
            width={894}
            height={300}
            priority
            className="h-auto w-40 sm:w-52"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 lg:flex">
          <Link href="/pdf-tools" className="rounded-lg px-2 py-1.5 hover:bg-slate-100">PDF Tools</Link>
          <Link href="/image-tools" className="rounded-lg px-2 py-1.5 hover:bg-slate-100">Image Tools</Link>
          <Link href="/utility-tools" className="rounded-lg px-2 py-1.5 hover:bg-slate-100">Utilities</Link>
          <Link href="/tools" className="rounded-lg px-2 py-1.5 hover:bg-slate-100">All Tools</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Search className="h-4 w-4" />
            <input
              aria-label="Search tools"
              placeholder="Search tools"
              className="w-28 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:w-36"
            />
          </label>
        </div>

        <button type="button" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
