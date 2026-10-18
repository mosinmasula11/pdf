import type { Metadata } from "next";
import { ScanPdfTool } from "@/components/tools/ScanPdfTool";

export const metadata: Metadata = {
  title: "Scan to PDF",
  description: "Scan documents using your device camera or uploaded photos and convert them into organized PDF files.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Scan to PDF</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Capture pages directly with your webcam or phone camera, apply document enhancements, and save as a clean PDF.
      </p>
      <div className="mt-8">
        <ScanPdfTool />
      </div>
    </div>
  );
}

