import Link from "next/link";
import { Menu, Search, SunMedium } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-500 text-lg font-bold text-white shadow-md shadow-violet-500/20">
            M
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{siteConfig.brandName}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Browser-first tools</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 lg:flex">
          <div className="group relative">
            <button className="rounded-lg px-2 py-1.5 hover:bg-slate-100">PDF Tools</button>
          </div>
          <div className="group relative">
            <button className="rounded-lg px-2 py-1.5 hover:bg-slate-100">Image Tools</button>
          </div>
          <div className="group relative">
            <button className="rounded-lg px-2 py-1.5 hover:bg-slate-100">Other Tools</button>
          </div>
          <Link href="/tools" className="rounded-lg px-2 py-1.5 hover:bg-slate-100">All Tools</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Search className="h-4 w-4" />
            <input
              aria-label="Search tools"
              placeholder="Search tools"
              className="w-36 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <button aria-label="Toggle theme" className="rounded-xl border border-slate-200 p-2 text-slate-700">
            <SunMedium className="h-4 w-4" />
          </button>
        </div>

        <button className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
