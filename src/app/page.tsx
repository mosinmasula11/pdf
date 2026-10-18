import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Scissors, Search, Shield, Sparkles, Zap } from "lucide-react";
import { ToolGridCard } from "@/components/tools/ToolGridCard";
import { availableTools, featuredTools } from "@/lib/tool-registry";

export default function HomePage() {
  const toolsByCategory = availableTools.reduce<Record<string, typeof availableTools>>((groups, tool) => {
    groups[tool.category] ??= [];
    groups[tool.category].push(tool);
    return groups;
  }, {});

  const categories = [
    {
      name: "PDF Tools",
      description: "Convert, merge, split and rotate PDF documents.",
      href: "/pdf-tools",
      image: "/images/categories/pdf-tools.png",
      count: availableTools.filter((tool) => tool.category === "PDF Tools").length,
      theme: "from-rose-50 to-orange-50",
    },
    {
      name: "Image Tools",
      description: "Compress and resize images for sharing or upload.",
      href: "/image-tools",
      image: "/images/categories/image-tools.png",
      count: availableTools.filter((tool) => tool.category === "Image Tools").length,
      theme: "from-sky-50 to-violet-50",
    },
    {
      name: "Utility Tools",
      description: "Quick everyday helpers for text and structured data.",
      href: "/utility-tools",
      image: "/images/categories/utility-tools.png",
      count: availableTools.filter((tool) => tool.category === "Utilities").length,
      theme: "from-violet-50 to-fuchsia-50",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid items-center lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="px-6 py-8 sm:px-9 lg:py-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" />
                Free, fast and private
              </div>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Your files. Your device. <span className="bg-gradient-to-r from-sky-500 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Your tools.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Convert, compress and manage PDFs and images with simple tools that run right in your browser.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input aria-label="Search all tools" placeholder="Search tools" className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                </label>
                <Link href="/tools" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-violet-600 to-fuchsia-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-105">
                  Explore tools <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-600" />Files stay on your device</span>
                <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" />No account needed</span>
              </div>
            </div>
          </div>

          <div className="relative min-h-72 bg-slate-100 sm:min-h-96 lg:min-h-[31rem]">
            <Image
              src="/images/homepage-hero.webp"
              alt="MSYN Tools helps you manage PDFs and images with private file tools"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-contain object-center"
            />
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Browse by category</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Find the right tool for the job</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className={`group flex min-h-48 items-center gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br ${category.theme} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
            >
              <Image
                src={category.image}
                alt=""
                width={112}
                height={112}
                sizes="112px"
                className="h-24 w-24 shrink-0 object-contain transition group-hover:scale-105 sm:h-28 sm:w-28"
              />
              <div>
                <div className="text-lg font-bold text-slate-900">{category.name}</div>
                <p className="mt-1 text-sm leading-5 text-slate-600">{category.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
                  {category.count} tools <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Popular tools</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Most used utilities</h2>
          </div>
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
            View all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolGridCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Why choose us</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Built for privacy and speed</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Local processing",
              description: "Files are processed directly in your browser and never uploaded to a remote server.",
              icon: Shield,
            },
            {
              title: "No account needed",
              description: "Use the tools immediately without creating an account, password or profile.",
              icon: Zap,
            },
            {
              title: "Optimized workflow",
              description: "Fast, drag-and-drop tools with simple controls for mobile and desktop users.",
              icon: Scissors,
            },
          ].map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-violet-600 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-slate-900">Available tools</h2>
        <div className="mt-6 space-y-10">
          {Object.entries(toolsByCategory).map(([category, tools]) => {
            const toolsBySubcategory = tools.reduce<Record<string, typeof tools>>((groups, tool) => {
              const subcategory = tool.subcategory ?? category;
              groups[subcategory] ??= [];
              groups[subcategory].push(tool);
              return groups;
            }, {});

            return (
              <section key={category}>
                <h3 className="mb-5 text-2xl font-bold text-slate-900">{category}</h3>
                <div className="space-y-7">
                  {Object.entries(toolsBySubcategory).map(([subcategory, subcategoryTools]) => (
                    <section key={subcategory}>
                      <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        {subcategory}
                      </h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {subcategoryTools.map((tool) => <ToolGridCard key={tool.id} tool={tool} />)}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="mt-16 rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">How it works</p>
            <h2 className="mt-2 text-3xl font-bold">Create, adjust and download in minutes</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Select a tool",
                "Choose files",
                "Configure options",
                "Process locally",
                "Download the result",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-sm font-bold">{index + 1}</div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold">Trust and privacy</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>• Files stay on your device.</li>
              <li>• No registration or login required.</li>
              <li>• No backend file uploads.</li>
              <li>• Free access with no hidden fees.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
