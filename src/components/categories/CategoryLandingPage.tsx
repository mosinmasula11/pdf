import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toolRegistry, type ToolCategory } from "@/lib/tool-registry";

const accentClasses = {
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

type CategoryLandingPageProps = {
  category: ToolCategory;
  title: string;
  description: string;
  image: string;
  accent: keyof typeof accentClasses;
};

export function CategoryLandingPage({
  category,
  title,
  description,
  image,
  accent,
}: CategoryLandingPageProps) {
  const tools = toolRegistry.filter((tool) => tool.category === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="absolute -right-10 -top-16 -z-10 h-72 w-72 rounded-full bg-violet-100/70 blur-3xl" />
        <div className="grid items-center gap-8 md:grid-cols-[1fr_220px]">
          <div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentClasses[accent]}`}>
              {tools.length} browser-based tools
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Files are processed locally in your browser.
            </p>
          </div>
          <Image
            src={image}
            alt=""
            width={220}
            height={220}
            priority
            className="mx-auto h-40 w-40 object-contain md:h-52 md:w-52"
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">Choose a tool</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.path}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <h3 className="flex items-center justify-between gap-3 font-semibold text-slate-900">
                {tool.name}
                <ArrowRight className="h-4 w-4 shrink-0 text-violet-600 transition group-hover:translate-x-1" />
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
              <p className="mt-4 text-xs font-medium text-slate-400">
                Supports {tool.supportedFormats.join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
