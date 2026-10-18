import type { Metadata } from "next";
import { RemovePagesTool } from "@/components/tools/RemovePagesTool";

export const metadata: Metadata = {
  title: "Remove Pages from PDF",
  description: "Delete specific pages from your PDF document online without uploading to servers.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Remove Pages from PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Quickly delete unwanted pages from your PDF and download a clean, updated document.
      </p>
      <div className="mt-8">
        <RemovePagesTool />
      </div>
    </div>
  );
}

