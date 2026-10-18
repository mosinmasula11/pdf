import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, Lock, Globe, ExternalLink } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${siteConfig.brandName}. Fast, free and private online PDF, image and document productivity tools.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
          Our Mission &amp; Story
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          About {siteConfig.brandName}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {siteConfig.brandName} is a comprehensive suite of browser-based document productivity tools designed to make file conversion, organization, compression, editing, and security instantaneous, secure, and universally accessible.
        </p>
      </div>

      <div className="my-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">100% Client Privacy</h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Files are processed locally in your browser memory via WebAssembly and JavaScript. No document uploads, no server storage.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-amber-50 p-3 text-amber-600">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Zero Barriers</h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            No registration, account sign-up, or subscription paywalls required to access our core document tools.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-sky-50 p-3 text-sky-600">
            <Globe className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Part of the MSYN Network</h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Proudly connected with{" "}
            <a href={siteConfig.mainSiteUrl} target="_blank" rel="noreferrer" className="text-sky-600 font-semibold hover:underline">
              msyn.in
            </a>
            , delivering dependable digital web utilities.
          </p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">Built for Individuals, Students, and Professionals</h2>
        <p>
          Whether you need to combine contracts, compress PDF files for email attachments, extract data into Excel spreadsheets, convert PowerPoint slides, or digitally sign documents, {siteConfig.brandName} delivers desktop-grade functionality directly in your web browser.
        </p>

        <h2 className="text-xl font-bold text-slate-900">Contact &amp; Connect</h2>
        <p>
          Need assistance or want to suggest new features? Reach out to our team at{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="font-semibold text-violet-600 hover:underline">
            {siteConfig.supportEmail}
          </a>{" "}
          or{" "}
          <a href={`mailto:${siteConfig.techEmail}`} className="font-semibold text-sky-600 hover:underline">
            {siteConfig.techEmail}
          </a>.
        </p>
      </div>
    </div>
  );
}
