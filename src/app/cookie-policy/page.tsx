import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Cookie Policy | Privacy Disclosures",
  description:
    "Cookie Policy for MSYN Tools. Clear disclosures on functional and technical cookies used to operate our tools.",
  alternates: {
    canonical: "/cookie-policy",
  },
};

export default function CookiePolicyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <Cookie className="h-4 w-4 text-amber-600" />
          Transparent Cookie &amp; Storage Disclosures
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Cookie Policy
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Last revised: <span className="font-medium text-slate-700">{lastUpdated}</span>
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          This Cookie Policy explains how {siteConfig.brandName} uses cookies, local browser storage, and related technologies to provide a responsive, secure, and privacy-respecting file processing experience.
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-10 text-slate-700 mt-8">
        <section>
          <h2 className="text-2xl font-bold text-slate-900">1. What Are Cookies?</h2>
          <p className="mt-3 text-sm leading-7">
            Cookies are small text files placed on your computer or mobile device by websites that you visit. They are widely used to make websites work properly, improve user workflow efficiency, and provide basic technical telemetry to site operators. In modern web apps, Local Storage and Session Storage (HTML5 Web Storage) operate similarly by storing UI preferences directly on your device.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">2. Document Files and Content Guarantee</h2>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-950">
            <strong>Document Privacy Guarantee:</strong> Cookies and local storage keys are NEVER used to store, track, transmit, or monitor the contents of the PDF, Word, PowerPoint, Excel, or image files you process. Document data remains strictly within your browser&apos;s active memory and is discarded upon session termination.
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">3. Types of Cookies We Use</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">A. Strictly Necessary &amp; Security Cookies</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                These technical cookies are essential for navigating the website, preventing malicious automated requests, balancing server traffic, and preventing cross-site request forgery (CSRF). Because they are strictly required for platform operation, they do not require consent under EU ePrivacy directives.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">B. Functional &amp; Preference Storage</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                These keys remember your display preferences (such as selected compression defaults, preferred measurement units, and dark/light mode toggles) so you do not have to reconfigure them each time you visit.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">4. Managing and Disabling Cookies</h2>
          <p className="mt-2 text-sm leading-7">
            You can modify your browser settings to accept, decline, or delete cookies at any time. If you choose to disable all cookies, you may still access and use our PDF and image tools, though certain interface preference shortcuts may need to be reset on each visit.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li><strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Third-party cookies</li>
            <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
            <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
            <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">5. Contact Information</h2>
          <p className="mt-2 text-sm leading-6">
            If you have questions about our use of cookies or technical storage, please contact us at our{" "}
            <Link href="/contact" className="font-semibold text-violet-600 hover:underline">
              Contact Desk
            </Link>{" "}
            or review our{" "}
            <Link href="/privacy-policy" className="font-semibold text-violet-600 hover:underline">
              Privacy Policy
            </Link>.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
            <span>Support: <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 hover:underline">{siteConfig.supportEmail}</a></span>
            <span>Tech: <a href={`mailto:${siteConfig.techEmail}`} className="text-sky-600 hover:underline">{siteConfig.techEmail}</a></span>
            <span>Network: <a href={siteConfig.mainSiteUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">msyn.in</a></span>
          </div>
        </section>
      </div>
    </div>
  );
}
