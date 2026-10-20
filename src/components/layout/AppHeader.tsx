"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, Search, X } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { toolRegistry } from "@/lib/tool-registry";
import { getToolIcon } from "@/lib/tool-icons";

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
        toolIds: ["rotate-pdf", "add-page-numbers", "add-watermark", "crop-pdf", "edit-pdf", "pdf-forms", "flatten-pdf"],
      },
      {
        title: "PDF Security",
        toolIds: ["unlock-pdf", "protect-pdf", "sign-pdf", "redact-pdf", "compare-pdf", "pdf-metadata-editor"],
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
      { title: "Convert image", toolIds: ["image-to-ico", "svg-to-png", "image-converter", "webp-to-jpg"] },
      { title: "Photo tools", toolIds: ["pass-photo-maker", "signature-resizer"] },
    ],
  },
  {
    label: "All utility tools",
    href: "/utility-tools",
    groups: [
      { title: "Developer tools", toolIds: ["json-to-types", "jwt-debugger", "api-client", "epoch-converter", "url-converter", "json-formatter", "api-key-generator"] },
      { title: "Finance & Tax Calculators", toolIds: ["in-hand-salary-calculator", "income-tax-calculator", "gst-calculator", "sip-calculator", "lumpsum-calculator", "compound-interest-calculator", "fd-calculator", "emi-calculator"] },
      { title: "Math, Health & Utilities", toolIds: ["number-to-words", "percentage-calculator", "date-calculator", "bmi-calculator", "unit-converter", "age-calculator", "password-generator", "qr-code-generator", "word-counter"] },
    ],
  },
];

function ToolMenuGroups({
  menuIndex,
  onItemClick,
}: {
  menuIndex: number;
  onItemClick?: () => void;
}) {
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
              const Icon = getToolIcon(tool.id);

              return (
                <li key={tool.id}>
                  <Link
                    href={tool.path}
                    title={tool.name}
                    onClick={() => {
                      onItemClick?.();
                      if (typeof document !== "undefined") {
                        (document.activeElement as HTMLElement)?.blur();
                      }
                    }}
                    className="group/tool flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-800"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition group-hover/tool:bg-violet-100 group-hover/tool:text-violet-600">
                        <Icon className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="truncate">{tool.name}</span>
                    </span>
                    {tool.status === "beta" ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
                        Beta
                      </span>
                    ) : (
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300 opacity-0 transition group-hover/tool:opacity-100 group-hover/tool:text-violet-600" />
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
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredMenuIndex, setHoveredMenuIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setHoveredMenuIndex(null);
    setIsDesktopSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  // Handle ESC key to close any open menu
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setHoveredMenuIndex(null);
        setIsDesktopSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Click outside listener for desktop search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setIsDesktopSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTools = searchQuery.trim()
    ? toolRegistry.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setHoveredMenuIndex(null);
    setIsDesktopSearchOpen(false);
    setSearchQuery("");
    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${siteConfig.brandName} home`}
          onClick={handleLinkClick}
          className="flex shrink-0 items-center"
        >
          <Image
            src="/branding/msyn-tools-logo.png"
            alt={siteConfig.brandName}
            width={894}
            height={300}
            priority
            className="h-auto w-40 sm:w-52"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="relative hidden items-center gap-1 text-sm font-semibold text-slate-700 lg:flex"
        >
          {toolMenus.map((menu, index) => {
            const isMenuOpen = hoveredMenuIndex === index;

            return (
              <div
                key={menu.href}
                className="relative"
                onMouseEnter={() => setHoveredMenuIndex(index)}
                onMouseLeave={() => setHoveredMenuIndex(null)}
              >
                <Link
                  href={menu.href}
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  onClick={handleLinkClick}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-2.5 transition focus-visible:outline-2 focus-visible:outline-violet-600 ${
                    isMenuOpen
                      ? "bg-slate-100 text-violet-700"
                      : "hover:bg-slate-100 hover:text-violet-700"
                  }`}
                >
                  {menu.label}
                  <ChevronDown
                    className={`h-4 w-4 transition duration-200 ${
                      isMenuOpen ? "rotate-180 text-violet-700" : ""
                    }`}
                  />
                </Link>

                {isMenuOpen && (
                  <div
                    className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition duration-150 ${
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
                        <Link
                          href={menu.href}
                          onClick={handleLinkClick}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
                        >
                          Browse category <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                      <ToolMenuGroups menuIndex={index} onItemClick={handleLinkClick} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Link
            href="/tools"
            onClick={handleLinkClick}
            className="rounded-xl px-3 py-2.5 transition hover:bg-slate-100 hover:text-violet-700"
          >
            All tools
          </Link>
        </nav>

        {/* Desktop Search Bar */}
        <div ref={desktopSearchRef} className="relative hidden items-center gap-2 md:flex">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm focus-within:border-violet-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-500/20">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              aria-label="Search tools"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDesktopSearchOpen(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsDesktopSearchOpen(true);
              }}
              className="w-28 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:w-40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsDesktopSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          {/* Desktop Search Results Dropdown */}
          {isDesktopSearchOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {filteredTools.length} {filteredTools.length === 1 ? "tool found" : "tools found"}
              </p>
              {filteredTools.length > 0 ? (
                <ul className="space-y-1">
                  {filteredTools.map((tool) => {
                    const Icon = getToolIcon(tool.id);
                    return (
                      <li key={tool.id}>
                        <Link
                          href={tool.path}
                          onClick={handleLinkClick}
                          className="group/search flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition hover:bg-violet-50"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover/search:bg-violet-100 group-hover/search:text-violet-600">
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-slate-800 group-hover/search:text-violet-800">
                              {tool.name}
                            </span>
                            <span className="block truncate text-[11px] text-slate-500">
                              {tool.description}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No tools found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[65px] z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={handleLinkClick}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="fixed inset-x-0 top-[65px] z-50 max-h-[calc(100vh-65px)] overflow-y-auto border-b border-slate-200 bg-white p-5 shadow-2xl lg:hidden">
            {/* Mobile Search */}
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 focus-within:border-violet-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-500/20">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                aria-label="Search tools"
                placeholder="Search all 33+ tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* If searching on mobile, show search results */}
            {searchQuery.trim().length > 0 ? (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold text-slate-500">
                  Search results ({filteredTools.length})
                </p>
                {filteredTools.length > 0 ? (
                  <ul className="space-y-1">
                    {filteredTools.map((tool) => {
                      const Icon = getToolIcon(tool.id);
                      return (
                        <li key={tool.id}>
                          <Link
                            href={tool.path}
                            onClick={handleLinkClick}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition active:bg-violet-50"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900">{tool.name}</p>
                                <p className="line-clamp-1 text-[11px] text-slate-500">{tool.description}</p>
                              </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-violet-600" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    No tools found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            ) : (
              /* Regular Mobile Navigation Groups */
              <div>
                {toolMenus.map((menu, index) => (
                  <section key={menu.href} className="border-b border-slate-100 py-3.5 first:pt-0 last:border-0">
                    <div className="mb-2 flex items-center justify-between">
                      <Link
                        href={menu.href}
                        onClick={handleLinkClick}
                        className="text-sm font-bold text-violet-700 hover:text-violet-900"
                      >
                        {menu.label}
                      </Link>
                      <Link
                        href={menu.href}
                        onClick={handleLinkClick}
                        className="text-[11px] font-semibold text-slate-500 hover:text-violet-700"
                      >
                        View all
                      </Link>
                    </div>
                    <ToolMenuGroups menuIndex={index} onItemClick={handleLinkClick} />
                  </section>
                ))}

                <div className="mt-4 pt-2">
                  <Link
                    href="/tools"
                    onClick={handleLinkClick}
                    className="flex w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-center text-sm font-bold text-white shadow-md shadow-violet-600/20 transition active:scale-[0.99] hover:bg-violet-700"
                  >
                    Browse all tools
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
