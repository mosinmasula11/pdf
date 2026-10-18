import type { Metadata } from "next";
import { PasswordGeneratorTool } from "@/components/tools/PasswordGeneratorTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("password-generator");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Strong Password Generator</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Generate strong, random, and cryptographically secure passwords, memorable passphrases, or numeric PINs locally on your device with 0 network tracking.
      </p>
      <div className="mt-8">
        <PasswordGeneratorTool />
      </div>
    </div>
  );
}

