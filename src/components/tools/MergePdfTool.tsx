"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileStack, LoaderCircle } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("merged.pdf");

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    setFiles(next);
    setError(next.length === 0 ? "Please choose PDF files to merge." : null);
  };

  const merge = async () => {
    if (!files.length) {
      setError("Select at least two PDF files for merging.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const destPdf = await PDFDocument.create();

      for (const file of files) {
        const srcPdf = await PDFDocument.load(await file.arrayBuffer());
        const copiedPages = await destPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page) => destPdf.addPage(page));
      }

      const mergedBytes = await destPdf.save();
      const buffer = mergedBytes.buffer.slice(mergedBytes.byteOffset, mergedBytes.byteOffset + mergedBytes.byteLength) as ArrayBuffer;
      const mergedBlob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(mergedBlob);
      setDownloadName(`merged-${Date.now()}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-100 p-2 text-sky-600">
          <FileStack className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Merge PDF</h2>
          <p className="text-sm text-slate-500">Combine multiple PDFs into a single file.</p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={merge}
          disabled={processing || files.length < 2}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {processing ? "Merging..." : "Merge PDFs"}
        </button>
        <button type="button" onClick={() => setFiles([])} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">
          Clear
        </button>
      </div>

      {files.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-medium text-slate-900">Selected PDFs</div>
          <ul className="mt-2 space-y-1">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex justify-between gap-4">
                <span className="truncate">{file.name}</span>
                <span>{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultBlob && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, downloadName)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Download merged PDF
          </button>
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
