import type { Metadata } from "next";
import { PdfToExcelTool } from "@/components/tools/PdfToExcelTool";

export const metadata: Metadata = {
  title: "PDF to Excel Converter Online",
  description: "Extract data and tabular figures from PDF documents into editable Excel spreadsheets and CSV tables.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">PDF to EXCEL</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Automatically detect and extract data tables from PDF documents into XLSX and CSV spreadsheets.
      </p>
      <div className="mt-8">
        <PdfToExcelTool />
      </div>
    </div>
  );
}

