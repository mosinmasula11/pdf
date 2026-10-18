import type { Metadata } from "next";
import { ApiClientTool } from "@/components/tools/ApiClientTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("api-client");

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          REST API Client &amp; Tester
        </h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600 sm:text-lg">
          Fast, browser-based REST API client and testing tool. Send GET, POST, PUT, and DELETE requests, inspect status codes, headers, and response payloads, generate code snippets, and manage collections.
        </p>
      </div>

      <ApiClientTool />
    </div>
  );
}

