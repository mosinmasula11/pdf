import type { Metadata } from "next";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("base64-converter");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Base64 Encoder & Decoder</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Encode text and files to Base64 data strings or decode Base64 back to plain text and data URLs with full UTF-8 support.
      </p>
      <div className="mt-8">
        <Base64Tool />
      </div>
    </div>
  );
}

