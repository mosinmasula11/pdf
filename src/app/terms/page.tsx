import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck, Shield, AlertTriangle, Scale, HelpCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service and User Agreement for MSYN Tools. Clear guidelines on file ownership, acceptable use, privacy, and service terms.",
};

export default function TermsPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
          <FileCheck className="h-4 w-4 text-violet-600" />
          Official User Agreement & Service Terms
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Last revised: <span className="font-medium text-slate-700">{lastUpdated}</span>
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Welcome to {siteConfig.brandName}. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our web platform, browser-based PDF tools, image editors, and related utilities. By accessing or using our services, you agree to be bound by these Terms and our Privacy Policy.
        </p>
      </div>

      {/* Highlights */}
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900">100% Your Ownership</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            You retain all copyright, title, and ownership of all files, images, and text you process.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-violet-50 p-2.5 text-violet-600">
            <Scale className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900">Fair & Transparent</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            No hidden contracts, no account required to use core browser utilities, and zero tracking of document contents.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-amber-50 p-2.5 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900">Acceptable Use</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Users must hold proper rights to documents and refrain from processing unlawful or malicious material.
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="prose prose-slate max-w-none space-y-10 text-slate-700">
        <section>
          <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p className="mt-3 text-sm leading-7">
            By visiting, accessing, or using {siteConfig.brandName} (including all associated websites, subdomains, and API endpoints), you confirm that you are at least 16 years of age (or the legal age of majority in your jurisdiction), have the legal capacity to enter into these Terms, and agree to comply with them fully. If you do not agree with any part of these Terms, you must discontinue using our services immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">2. Description of Service</h2>
          <p className="mt-2 text-sm leading-7">
            {siteConfig.brandName} provides a comprehensive suite of online file productivity tools, including but not limited to:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            <li><strong>PDF Organization:</strong> Merge PDF, Split PDF, Remove Pages, Extract Pages, Organize Pages, and Scan to PDF.</li>
            <li><strong>PDF Optimization:</strong> Compress PDF, Repair PDF, and OCR text extraction.</li>
            <li><strong>Conversions to PDF:</strong> JPG to PDF, Word to PDF, PowerPoint to PDF, Excel to PDF, and HTML to PDF.</li>
            <li><strong>Conversions from PDF:</strong> PDF to JPG, PDF to Word (.docx), PDF to PowerPoint (.pptx), PDF to Excel (.xlsx/.csv), and PDF to PDF/A.</li>
            <li><strong>PDF Editing & Forms:</strong> Rotate PDF, Add Page Numbers, Add Watermark, Crop PDF, Edit & Annotate PDF, and PDF Forms Filler.</li>
            <li><strong>Security & Privacy:</strong> Unlock PDF, Protect PDF (encryption), Sign PDF, Redact PDF, and Compare PDF versions.</li>
            <li><strong>Document Intelligence:</strong> AI Summarizer, Document Translator, and PDF to Markdown.</li>
          </ul>
          <p className="mt-3 text-sm leading-7">
            All operations are designed to prioritize client-side execution in your browser, maintaining maximum speed, reliability, and data privacy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">3. User Content & Intellectual Property Ownership</h2>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-950">
            <strong>Absolute Ownership Guarantee:</strong> You retain complete, unencumbered ownership, title, copyright, and intellectual property rights in all documents, files, data, text, fonts, and graphics that you submit or process using {siteConfig.brandName}.
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>
              <strong>No License Granted:</strong> We do NOT claim any license, copyright, or usage rights over your files. We do not inspect, publish, share, sell, or retain your files.
            </li>
            <li>
              <strong>Proprietary Platform Assets:</strong> The service layout, visual design, icons, logos, code, domain name, documentation, and algorithms comprising {siteConfig.brandName} are the exclusive intellectual property of {siteConfig.brandName} and its licensors, protected by copyright, trademark, and trade secret laws.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">4. User Obligations & Acceptable Use Policy</h2>
          <p className="mt-2 text-sm leading-7">
            You agree to use {siteConfig.brandName} exclusively for lawful purposes in compliance with all applicable local, national, and international laws. When using our platform, you agree that you will NOT:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">No Infringing Content</strong>
              Do not process files that violate third-party copyrights, trademarks, trade secrets, or patents.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">No Unlawful or Harmful Files</strong>
              Do not upload content containing malware, spyware, trojans, ransomware, or illegal exploitation material.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">No Automated Abuse</strong>
              Do not launch automated scrapers, denial-of-service (DDoS) attacks, or scripts intended to overwhelm our infrastructure.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">No Reverse Engineering</strong>
              Do not decompile, reverse engineer, or disassemble proprietary backend routines or service controls.
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">5. Privacy & Data Protection</h2>
          <p className="mt-2 text-sm leading-7">
            Your privacy is fundamental to our architecture. The collection and processing of diagnostic telemetry and the handling of client-side file workflows are governed by our{" "}
            <Link href="/privacy-policy" className="font-semibold text-violet-700 hover:underline">
              Privacy Policy
            </Link>
            , which is incorporated into and forms an integral part of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">6. Disclaimers of Warranties (&quot;As Is&quot; &amp; &quot;As Available&quot;)</h2>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-950">
            <strong>Important Legal Disclaimer:</strong> The services, tools, and output generated by {siteConfig.brandName} are provided strictly on an <em>&quot;AS IS&quot;</em> and <em>&quot;AS AVAILABLE&quot;</em> basis without warranties of any kind, either express or implied.
          </div>
          <p className="mt-3 text-sm leading-7">
            While we continuously test and engineer our file conversion, repair, OCR, and compression algorithms for optimal fidelity, we do not warrant that:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            <li>The service will meet all specific formatting or rendering requirements of heavily damaged or non-standard source documents.</li>
            <li>The service will operate completely uninterrupted, bug-free, or without transient browser memory limits on excessively large files.</li>
            <li>The results of OCR or automated translations will be 100% error-free in all languages or degraded scans.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">7. Limitation of Liability</h2>
          <p className="mt-2 text-sm leading-7">
            To the maximum extent permitted by applicable law, in no event shall {siteConfig.brandName}, its founders, directors, employees, affiliates, or licensors be liable for any indirect, incidental, special, consequential, or punitive damages—including without limitation loss of profits, loss of data, loss of business goodwill, or computer malfunction—arising out of or in connection with your use or inability to use the services.
          </p>
          <p className="mt-2 text-sm leading-7">
            In any event, our aggregate liability for any claims under these Terms shall be limited to the amount paid by you (if any) to use {siteConfig.brandName} during the twelve (12) months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">8. Indemnification</h2>
          <p className="mt-2 text-sm leading-7">
            You agree to defend, indemnify, and hold harmless {siteConfig.brandName}, its officers, directors, employees, and agents from and against any claims, damages, liabilities, costs, and expenses (including reasonable attorney fees) arising from:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Your violation of these Terms or applicable laws;</li>
            <li>Any dispute or claim that files processed by you infringe upon the rights (including intellectual property or privacy rights) of a third party;</li>
            <li>Your misuse of the platform or violation of any third-party rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">9. Modifications to the Service and Terms</h2>
          <p className="mt-2 text-sm leading-7">
            We reserve the right to enhance, modify, update, or temporarily discontinue any tool or feature at any time without prior liability. We may also revise these Terms periodically. When changes occur, we will update the &quot;Last revised&quot; date at the top of this document. Continued use of the platform following any modifications constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">10. Governing Law & Dispute Resolution</h2>
          <p className="mt-2 text-sm leading-7">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the service operator is established, without regard to conflict of law principles. Any legal disputes or claims arising out of or related to these Terms shall be submitted to the exclusive jurisdiction of the competent courts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">11. Severability & Entire Agreement</h2>
          <p className="mt-2 text-sm leading-7">
            If any provision of these Terms is found to be invalid or unenforceable under applicable law, such provision shall be enforced to the maximum extent permissible, and the remaining provisions shall continue in full force and effect. These Terms, together with our Privacy Policy, constitute the complete agreement between you and {siteConfig.brandName} regarding your use of the service.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">12. Questions or Contact Information</h2>
          <p className="mt-2 text-sm leading-6">
            If you have any questions or require legal clarifications regarding these Terms of Service, please contact our team:
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><strong>Platform:</strong> {siteConfig.brandName}</p>
            <p><strong>Support Email:</strong> <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 font-semibold hover:underline">{siteConfig.supportEmail}</a></p>
            <p><strong>Technical Inquiries:</strong> <a href={`mailto:${siteConfig.techEmail}`} className="text-sky-600 font-semibold hover:underline">{siteConfig.techEmail}</a></p>
            <p><strong>Website:</strong> <a href={siteConfig.url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">{siteConfig.url}</a></p>
            <p><strong>Network Portal:</strong> <a href={siteConfig.mainSiteUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:underline">{siteConfig.mainSiteUrl}</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
