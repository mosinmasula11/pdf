import Link from "next/link";
import { ArrowRight, FileImage, FileText, Scissors, Search, Shield, Sparkles, Zap } from "lucide-react";
import { featuredTools, toolRegistry } from "@/lib/tool-registry";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Fast, free and private
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Free Online PDF, Image & File Tools
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Compress, convert, resize, edit and manage your files online. Fast, free and private — your files stay in your browser.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input aria-label="Search all tools" placeholder="Search tools" className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
              </label>
              <Link href="/tools" className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700">
                Explore tools
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-600">
              {["JPG to PDF", "Compress image", "Resize to 50KB", "Merge PDF"].map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 p-6 text-white shadow-2xl shadow-slate-900/10">
            <div className="grid gap-4">
              {[
                { label: "Tools ready", value: "50+" },
                { label: "No login", value: "Required" },
                { label: "Processing", value: "Local" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-200">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Popular tools</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Most used utilities</h2>
          </div>
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
            View all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {featuredTools.map((tool) => (
            <Link key={tool.id} href={tool.path} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
              <div className="mb-4 inline-flex rounded-2xl bg-violet-50 p-3 text-violet-600">
                {tool.category === "PDF Tools" ? <FileText className="h-5 w-5" /> : tool.category === "Image Tools" ? <FileImage className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{tool.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
            </Link>
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
        <h2 className="text-3xl font-bold text-slate-900">All tools</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {Object.entries(
            toolRegistry.reduce<Record<string, typeof toolRegistry>>((acc, tool) => {
              acc[tool.category] ??= [];
              acc[tool.category].push(tool);
              return acc;
            }, {}),
          ).map(([category, tools]) => (
            <div key={category} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">{category}</h3>
              <ul className="space-y-3">
                {tools.map((tool) => (
                  <li key={tool.id}>
                    <Link href={tool.path} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:border-violet-200 hover:bg-violet-50">
                      <span>{tool.name}</span>
                      <ArrowRight className="h-4 w-4 text-violet-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
