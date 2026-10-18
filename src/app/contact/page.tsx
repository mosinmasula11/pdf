import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Globe, MessageSquare, ShieldCheck, ExternalLink, HelpCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact the ${siteConfig.brandName} team for support, technical questions, or general inquiries at support@msyn.in and tech.msyn@gmail.com.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
          <MessageSquare className="h-4 w-4 text-sky-600" />
          Get in Touch
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Contact Support &amp; Team
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Have questions about our PDF and image tools, feature suggestions, or business inquiries? Reach out to us through our direct contact channels.
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="my-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Support Mail */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="mb-4 inline-flex rounded-xl bg-violet-100 p-3 text-violet-700">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Customer Support</h2>
          <p className="mt-1 text-xs text-slate-500">
            Assistance with document processing, tool feedback, and general queries.
          </p>
          <div className="mt-4">
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800 hover:underline"
            >
              {siteConfig.supportEmail}
            </a>
          </div>
        </div>

        {/* Technical Mail */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="mb-4 inline-flex rounded-xl bg-sky-100 p-3 text-sky-700">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Technical Inquiries</h2>
          <p className="mt-1 text-xs text-slate-500">
            Bug reports, browser engine compatibility, or technical feedback.
          </p>
          <div className="mt-4">
            <a
              href={`mailto:${siteConfig.techEmail}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-800 hover:underline"
            >
              {siteConfig.techEmail}
            </a>
          </div>
        </div>

        {/* Official Websites */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="mb-4 inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700">
            <Globe className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Websites</h2>
          <p className="mt-1 text-xs text-slate-500">
            Explore our main platform and related digital tools.
          </p>
          <div className="mt-4 space-y-1.5 text-sm font-medium">
            <div>
              <a
                href={siteConfig.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
              >
                <span>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div>
              <a
                href={siteConfig.mainSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline"
              >
                <span>{siteConfig.mainSiteUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Trust & Response info */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Private &amp; Secure Processing Guarantee
            </div>
            <p className="text-xs text-slate-600">
              All PDF and image processing executes locally in your browser. We never collect or inspect your uploaded files.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/privacy-policy"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
