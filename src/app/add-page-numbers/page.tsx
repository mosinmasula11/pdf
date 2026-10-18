import type { Metadata } from "next";
import { AddPageNumbersTool } from "@/components/tools/AddPageNumbersTool";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF Online",
  description: "Insert customizable page numbers, headers, and footers into your PDF documents.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Add Page Numbers to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Choose page number position, typography, numbering format, and starting number easily.
      </p>
      <div className="mt-8">
        <AddPageNumbersTool />
      </div>
    </div>
  );
}

