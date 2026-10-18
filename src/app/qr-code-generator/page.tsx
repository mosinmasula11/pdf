import type { Metadata } from "next";
import { QrCodeTool } from "@/components/tools/QrCodeTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("qr-code-generator");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">QR Code Generator</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Create customizable QR codes for websites, WhatsApp chat links, WiFi networks, text, email, and phone numbers instantly.
      </p>
      <div className="mt-8">
        <QrCodeTool />
      </div>
    </div>
  );
}

