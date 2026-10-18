import type { Metadata } from "next";
import { ExcelToPdfTool } from "@/components/tools/ExcelToPdfTool";

export const metadata: Metadata = {
  title: "Excel to PDF Converter Online",
  description: "Convert Excel spreadsheets (.xlsx, .csv, .tsv) into clean, organized PDF documents.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">EXCEL to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Turn your spreadsheets and data tables into beautifully formatted, printable PDF reports.
      </p>
      <div className="mt-8">
        <ExcelToPdfTool />
      </div>
    </div>
  );
}

