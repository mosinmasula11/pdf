import type { Metadata } from "next";
import { ApiClientWorkspace } from "@/components/tools/ApiClientWorkspace";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("api-client");

export default function Page() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold text-[var(--brand)]">MSYN Tools / Developer utilities</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          API Client
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Send a request. Inspect the response.
        </p>
      </div>

      <ApiClientWorkspace />
    </div>
  );
}

