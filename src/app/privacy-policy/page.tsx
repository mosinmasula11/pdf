import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy | Local Files, Translation & API Requests",
  description:
    "Learn how MSYN Tools protects your files and privacy. Full GDPR and CCPA compliant privacy policy with local in-browser file security.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Zero-Knowledge & Privacy-First Architecture
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Last updated: <span className="font-medium text-slate-700">{lastUpdated}</span>
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          At {siteConfig.brandName}, we believe that your documents, images, and files belong exclusively to you. This Privacy Policy explains our commitment to file confidentiality, client-side data security, and compliance with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and international privacy frameworks.
        </p>
      </div>

      {/* Highlights Banner */}
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-violet-50 p-2.5 text-violet-600">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900">Your Files Are Yours</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            We never view, analyze, mine, sell, or copy the contents of the documents you process.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900">Local Browser Processing</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Most tools execute in your browser. Translation sends opted-in text to MyMemory. The REST client sends requests to your chosen API, through our server when proxy mode is enabled.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-sky-50 p-2.5 text-sky-600">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-slate-900">Zero File Storage</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            We do not store your files on backend servers or databases. When your tab closes, data vanishes.
          </p>
        </div>
      </div>

      <section className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <h2 className="text-xl font-bold">Optional external translation</h2>
        <p className="mt-2">Translate PDF is an exception to local-only text processing. After you opt in on that tool, extracted document text is sent to MyMemory for translation. The PDF file itself is not uploaded. This service has its own privacy and retention practices; do not translate confidential material without reviewing them.</p>
        <a href="https://mymemory.translated.net/doc/usagelimits.php" className="mt-2 inline-block underline">MyMemory usage information</a>
      </section>
      {/* Main Content Sections */}
      <div className="prose prose-slate max-w-none space-y-10 text-slate-700">
        <section>
          <h2 className="text-2xl font-bold text-slate-900">1. Introduction and Data Controller</h2>
          <p className="mt-3 text-sm leading-7">
            This Privacy Policy applies to all services, web tools, applications, and features offered by{" "}
            <strong>{siteConfig.brandName}</strong> (accessible at{" "}
            <Link href="/" className="font-medium text-violet-600 hover:underline">
              {siteConfig.url}
            </Link>
            ).
          </p>
          <p className="mt-2 text-sm leading-7">
            For the purposes of European Data Protection Law (including GDPR Art. 4(7)), {siteConfig.brandName} acts as the Data Controller regarding personal data collected for website operation, and as a Data Processor for technical processing requests initiated by users through our automated file utilities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">2. Document Files and Content Privacy</h2>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-900">
            <strong>Key Principle:</strong> We do not claim any ownership rights over the files, text, images, or metadata contained within documents you process using {siteConfig.brandName}.
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>
              <strong>Client-Side Execution:</strong> The majority of our PDF and image tools operate purely inside your client browser using WebAssembly, HTML5 APIs, and JavaScript. Your files are loaded into your browser’s temporary RAM and never sent across the internet to our backend servers.
            </li>
            <li>
              <strong>No Human Review:</strong> No employee, contractor, or algorithm accesses or inspects the confidential content of your files.
            </li>
            <li>
              <strong>No Machine Learning Training:</strong> We do NOT use your documents, signatures, scanned photos, or extracted text to train artificial intelligence, large language models, or machine learning algorithms.
            </li>
            <li>
              <strong>Immediate Deletion:</strong> Because files are manipulated in-browser, closing or refreshing the tab clears all file buffers immediately from memory.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">HTTP and WebSocket API Client Data</h2>
          <p className="mt-2 text-sm leading-7">
            Sending a request transmits its URL, enabled headers, authentication, and body to the API endpoint you choose. Proxy mode routes that request through our server; direct mode sends it from your browser. Responses are returned to your browser. The proxy does not write request or response contents to application storage.
          </p>
          <p className="mt-2 text-sm leading-7">
            History and collections keep request drafts, including bodies, in this browser’s local storage. Authentication fields and custom header values are cleared in saved drafts, and recognized secret fields are redacted. Raw text can still contain sensitive data: review bodies before saving or sending them. Closing a tab does not erase saved drafts; use the history and collection controls to remove them.
          </p>
          <p className="mt-2 text-sm leading-7">
            WebSocket direct mode connects from your browser to the endpoint you enter. If you select MSYN relay mode for custom handshake headers or authentication, your endpoint URL, headers, credentials and messages pass through our server to that endpoint. The relay verifies TLS certificates, blocks private and reserved destinations, and expires connections after five minutes. Relay sessions and their authorization tokens are held temporarily in server memory, not written to application storage. Message logs remain in browser memory unless you download them. Saved and recent connections use local browser storage; query values, headers, authentication values and subprotocols are not retained. Browser cookies apply only to direct connections and are not forwarded by the relay.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">3. Information We Collect</h2>
          <p className="mt-2 text-sm leading-7">
            We minimize data collection to only what is strictly necessary to deliver fast, dependable, and secure service:
          </p>

          <h3 className="mt-4 text-lg font-semibold text-slate-900">A. Technical and Diagnostic Data</h3>
          <p className="mt-1 text-sm leading-6">
            When you visit {siteConfig.brandName}, our servers and CDN edge providers may automatically log standard technical telemetry, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Truncated / anonymized IP address (for routing and DDoS prevention)</li>
            <li>Browser type, version, and device operating system</li>
            <li>Date, time, and duration of the web session</li>
            <li>Referring website address and pages visited</li>
          </ul>

          <h3 className="mt-4 text-lg font-semibold text-slate-900">B. Contact and Communication Data</h3>
          <p className="mt-1 text-sm leading-6">
            If you voluntarily contact our support team via email or our contact form, we collect your name, email address, and message contents solely to respond to your inquiry.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">4. Legal Bases for Processing (GDPR Art. 6)</h2>
          <p className="mt-2 text-sm leading-7">
            Under the EU General Data Protection Regulation (GDPR), we process personal data under the following lawful grounds:
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="border-b p-3">Processing Purpose</th>
                  <th className="border-b p-3">Legal Basis (GDPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium">Providing the PDF and image processing utilities</td>
                  <td className="p-3">Performance of a contract / Terms of Service (Art. 6(1)(b))</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Preventing DDoS attacks, abuse, and network intrusion</td>
                  <td className="p-3">Legitimate interests in system cybersecurity (Art. 6(1)(f))</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Responding to user support questions and feedback</td>
                  <td className="p-3">Performance of service and legitimate interest (Art. 6(1)(b)/(f))</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Optional analytics and user experience enhancement</td>
                  <td className="p-3">User consent where required by ePrivacy / Cookie directives (Art. 6(1)(a))</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">5. Data Security Safeguards</h2>
          <p className="mt-2 text-sm leading-7">
            We implement stringent technical and organizational security measures to protect the integrity of the platform:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            <li><strong>Transport Layer Security:</strong> All communications between your browser and our servers are encrypted via HTTPS with TLS 1.3 encryption.</li>
            <li><strong>Sandbox Isolation:</strong> File manipulation takes place within the browser’s sandboxed runtime, preventing unauthorized memory access or cross-origin leakage.</li>
            <li><strong>Strict Content Security Policy (CSP):</strong> Headers prevent malicious cross-site scripting (XSS) and unauthorized third-party script injection.</li>
            <li><strong>DDoS & Edge Shielding:</strong> Global CDN edge networks protect against unauthorized probing, rate abuse, and denial-of-service attempts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">6. Third-Party Service Providers</h2>
          <p className="mt-2 text-sm leading-7">
            We work with reputable infrastructure partners to deliver our web application globally. These subprocessors are bound by strict data processing agreements and confidentiality obligations:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li><strong>Hosting & Edge Delivery:</strong> Cloud infrastructure and Content Delivery Networks (CDNs) for asset caching and DDoS mitigation.</li>
            <li><strong>Security Auditing:</strong> Automated monitoring tools ensuring uptime and rapid incident response.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">7. Your Rights Under GDPR (European Union / UK)</h2>
          <p className="mt-2 text-sm leading-7">
            If you reside in the European Economic Area (EEA), United Kingdom, or Switzerland, you possess enforceable statutory rights regarding your personal information:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">Right of Access (Art. 15)</strong>
              Request copies of any personal telemetry or support correspondence held by us.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">Right to Rectification (Art. 16)</strong>
              Request correction of inaccurate or incomplete personal contact details.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">Right to Erasure (Art. 17)</strong>
              Request deletion of support history or personal records ("Right to be Forgotten").
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-900">Right to Object & Restrict (Art. 18/21)</strong>
              Object to specific processing activities or restrict processing pending review.
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            To exercise any of these rights, contact our privacy team at the contact details provided below. We will fulfill verified requests free of charge within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">8. California Privacy Rights (CCPA / CPRA Notice)</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
            <p className="font-semibold text-slate-900">Notice to California Residents:</p>
            <p className="mt-1">
              Under the California Consumer Privacy Act of 2018 (CCPA) and California Privacy Rights Act (CPRA), California consumers have specific rights regarding their personal data:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>No Sale of Personal Information:</strong> We do NOT sell your personal data or document content to data brokers or advertisers.</li>
              <li><strong>No Sharing for Cross-Context Behavioral Advertising:</strong> We do not share your personal data with third parties for cross-context behavioral marketing.</li>
              <li><strong>Right to Know & Delete:</strong> You have the right to request disclosure of categories of information collected, and request deletion without discrimination.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">9. Cookies and Local Storage</h2>
          <p className="mt-2 text-sm leading-7">
            We use minimal cookies and browser local storage strictly necessary for user interface preferences (such as light/dark mode and recent tool settings). We do not use intrusive third-party cross-site tracking cookies. You may consult our{" "}
            <Link href="/cookie-policy" className="font-semibold text-violet-700 hover:underline">
              Cookie Policy
            </Link>{" "}
            for full technical specifications and browser management options.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">10. Children’s Privacy (COPPA Compliance)</h2>
          <p className="mt-2 text-sm leading-7">
            {siteConfig.brandName} is intended for a general audience and does not knowingly collect, solicit, or maintain personal information from children under the age of 16. If we become aware that personal information of a minor has been submitted without verified parental consent, we will promptly delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">11. Updates to this Policy</h2>
          <p className="mt-2 text-sm leading-7">
            We may update this Privacy Policy periodically to reflect enhancements to our toolset, new legal regulations, or privacy standard improvements. Any revisions will be published on this page with an updated &quot;Last updated&quot; date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">12. Contacting Us About Privacy</h2>
          <p className="mt-2 text-sm leading-6">
            If you have questions, feedback, or requests regarding this Privacy Policy or your personal information, please reach out to our privacy compliance team:
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><strong>Organization:</strong> {siteConfig.brandName} Privacy &amp; Compliance Office</p>
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
