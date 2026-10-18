import type { Metadata } from "next";
import { EditPdfTool } from "@/components/tools/EditPdfTool";

export const metadata: Metadata = {
  title: "Edit PDF Online",
  description: "Annotate, draw, highlight and add custom text to your PDF documents directly in your browser.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Edit PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Free in-browser PDF editor to annotate pages, draw signatures, highlight important text, and add notes.
      </p>
      <div className="mt-8">
        <EditPdfTool />
      </div>
    </div>
  );
}

