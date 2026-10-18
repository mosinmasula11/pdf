"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("split.pdf");

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }

    try {
      const pdf = await PDFDocument.load(await selected.arrayBuffer());
      setFile(selected);
      setPageCount(pdf.getPageCount());
      setPageEnd(pdf.getPageCount());
      setError(null);
    } catch (err) {
      setFile(null);
      setPageCount(null);
      setError(err instanceof Error ? err.message : "The selected PDF could not be read.");
    }
  };

  const split = async () => {
    if (!file || pageCount === null) {
      setError("Select a valid PDF file.");
      return;
    }

    if (pageStart < 1 || pageEnd < pageStart || pageEnd > pageCount) {
      setError("Choose a valid page range.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const target = await PDFDocument.create();
      const pages = source.getPageIndices().slice(pageStart - 1, pageEnd);
      const copiedPages = await target.copyPages(source, pages);
      copiedPages.forEach((page) => target.addPage(page));
      const pdfBytes = await target.save();
      const buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-pages-${pageStart}-${pageEnd}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Split failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-100 p-2 text-blue-600"><FileText className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Split PDF</h2>
          <p className="text-sm text-slate-500">Extract a selected page range into a new PDF.</p>
        </div>
      </div>

      <input type="file" accept="application/pdf" onChange={(e) => handleFile(e.target.files)} className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm" />

      {file && pageCount !== null && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="mb-2 block font-medium text-slate-700">Start page</span>
            <input type="number" min={1} max={pageCount} value={pageStart} onChange={(e) => setPageStart(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
          </label>
          <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="mb-2 block font-medium text-slate-700">End page</span>
            <input type="number" min={1} max={pageCount} value={pageEnd} onChange={(e) => setPageEnd(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
          </label>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={split} disabled={processing || !file} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-300">
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {processing ? "Splitting..." : "Split PDF"}
        </button>
        {file && <button type="button" onClick={() => setFile(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">Clear</button>}
      </div>

      {file && <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Selected: {file.name} • {formatBytes(file.size)} • {pageCount ? `${pageCount} pages` : "Loading..."}</div>}
      {resultBlob && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, downloadName)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Download split PDF
          </button>
        </div>
      )}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
