import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Menu, Search } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";

const toolMenus = [
  {
    label: "All PDF tools",
    href: "/pdf-tools",
    groups: [
      {
        title: "Organize PDF",
        toolIds: ["merge-pdf", "split-pdf", "remove-pages", "extract-pages", "organize-pdf", "scan-pdf"],
      },
      {
        title: "Optimize PDF",
        toolIds: ["compress-pdf", "repair-pdf", "ocr-pdf"],
      },
      {
        title: "Convert to PDF",
        toolIds: ["jpg-to-pdf", "word-to-pdf", "powerpoint-to-pdf", "excel-to-pdf", "html-to-pdf"],
      },
      {
        title: "Convert from PDF",
        toolIds: ["pdf-to-jpg", "pdf-to-word", "pdf-to-powerpoint", "pdf-to-excel", "convert-pdf-to-pdfa"],
      },
      {
        title: "Edit PDF",
        toolIds: ["rotate-pdf", "add-page-numbers", "add-watermark", "crop-pdf", "edit-pdf", "pdf-forms"],
      },
      {
        title: "PDF Security",
        toolIds: ["unlock-pdf", "protect-pdf", "sign-pdf", "redact-pdf", "compare-pdf"],
      },
      {
        title: "PDF Intelligence",
        toolIds: ["pdf-summarize", "translate-pdf", "pdf-to-markdown"],
      },
    ],
  },
  {
    label: "All image tools",
    href: "/image-tools",
    groups: [
      { title: "Resize & optimize", toolIds: ["compress-image", "resize-image", "resize-image-to-custom-kb"] },
      { title: "Photo tools", toolIds: ["pass-photo-maker", "signature-resizer"] },
    ],
  },
  {
    label: "All utility tools",
    href: "/utility-tools",
    groups: [
      { title: "Text tools", toolIds: ["word-counter"] },
      { title: "Developer tools", toolIds: ["json-formatter"] },
    ],
  },
];

function ToolMenuGroups({ menuIndex }: { menuIndex: number }) {
  const menu = toolMenus[menuIndex];
  const isPdfTools = menuIndex === 0;

  return (
    <div
      className={`grid gap-5 ${
        isPdfTools
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
          : menu.groups.length === 3
          ? "grid-cols-1 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
      {menu.groups.map((group) => (
        <section key={group.title} className="flex flex-col">
          <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
            {group.title}
          </h3>
          <ul className="space-y-1">
            {group.toolIds.map((id) => {
              const tool = toolRegistry.find((entry) => entry.id === id);
              if (!tool) return null;

              return (
                <li key={tool.id}>
                  <Link
                    href={tool.path}
                    className="group/tool flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-800"
                  >
                    <span className="truncate">{tool.name}</span>
                    {tool.status === "beta" ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
                        Beta
                      </span>
                    ) : (
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300 transition group-hover/tool:text-violet-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
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

        <nav aria-label="Main navigation" className="relative hidden items-center gap-1 text-sm font-semibold text-slate-700 lg:flex">
          {toolMenus.map((menu, index) => (
            <div key={menu.href} className="group/nav">
              <Link
                href={menu.href}
                aria-haspopup="true"
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 transition hover:bg-slate-100 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                {menu.label}
                <ChevronDown className="h-4 w-4 transition group-hover/nav:rotate-180 group-focus-within/nav:rotate-180" />
              </Link>
              <div
                className={`invisible pointer-events-none absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition duration-150 group-hover/nav:visible group-hover/nav:pointer-events-auto group-hover/nav:translate-y-0 group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:pointer-events-auto group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 ${
                  index === 0 ? "w-[min(96vw,1200px)]" : "w-[min(88vw,800px)]"
                }`}
              >
                <div className="max-h-[82vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">{menu.label}</p>
                      <p className="mt-0.5 text-xs font-normal text-slate-500">
                        Choose a tool to get started immediately
                      </p>
                    </div>
                    <Link href={menu.href} className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900">
                      Browse category <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <ToolMenuGroups menuIndex={index} />
                </div>
              </div>
            </div>
          ))}
          <Link href="/tools" className="rounded-xl px-3 py-2.5 transition hover:bg-slate-100 hover:text-violet-700">
            All tools
          </Link>
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

        <details className="group/mobile relative lg:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open main menu</span>
          </summary>
          <div className="absolute right-0 top-full z-50 mt-3 max-h-[75vh] w-[min(92vw,440px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Search className="h-4 w-4" />
              <input aria-label="Search tools" placeholder="Search tools" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
            </div>
            {toolMenus.map((menu, index) => (
              <section key={menu.href} className="border-b border-slate-100 py-3 last:border-0">
                <Link href={menu.href} className="mb-2 block text-sm font-bold text-violet-700">
                  {menu.label}
                </Link>
                <ToolMenuGroups menuIndex={index} />
              </section>
            ))}
            <Link href="/tools" className="mt-3 block rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
              Browse all tools
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
