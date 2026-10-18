import type { Metadata } from "next";
import { ApiKeyGeneratorTool } from "@/components/tools/ApiKeyGeneratorTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("api-key-generator");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">API Key &amp; Token Generator</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Generate cryptographically secure random API keys, UUIDs, JWT secrets, NanoIDs, and hash tokens. Export directly to .env or .txt with zero server transmission.
      </p>
      <div className="mt-8">
        <ApiKeyGeneratorTool />
      </div>
    </div>
  );
}

