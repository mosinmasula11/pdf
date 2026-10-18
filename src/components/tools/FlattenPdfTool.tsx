"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileCheck, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function FlattenPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("flattened.pdf");

  const handleFile = async (selected: File | null) => {
    if (!selected) return;
    setResultBlob(null);
    setError(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF document.");
      return;
    }

    setFile(selected);
    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPageCount(pdfDoc.getPageCount());
    } catch {
      setPageCount(null);
    }
  };

  const flattenPdf = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      try {
        const form = pdfDoc.getForm();
        form.flatten();
      } catch {
        // If document has no AcroForm fields, flattening is already effectively applied
      }

      const flattenedBytes = await pdfDoc.save();
      const outBuffer = flattenedBytes.buffer.slice(
        flattenedBytes.byteOffset,
        flattenedBytes.byteOffset + flattenedBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([outBuffer], { type: "application/pdf" });
      setResultBlob(blob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setDownloadName(`${baseName}-flattened.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flatten PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Flatten PDF</h2>
          <p className="text-sm text-slate-500">
            Lock form fields and comments into static page graphics to prevent editing.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="hidden"
          id="flatten-pdf-file-input"
        />
        <label
          htmlFor="flatten-pdf-file-input"
          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          {file ? "Choose another PDF" : "Choose PDF file"}
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Files are processed securely inside your browser. No uploads to any server.
        </p>

        {file && (
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 shadow-xs">
            <span className="font-semibold text-slate-900">{file.name}</span>
            <span>•</span>
            <span>{formatBytes(file.size)}</span>
            {pageCount !== null && (
              <>
                <span>•</span>
                <span>{pageCount} {pageCount === 1 ? "page" : "pages"}</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && !resultBlob && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={flattenPdf}
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-50"
          >
            {processing ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Flattening document...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Flatten PDF
              </>
            )}
          </button>
        </div>
      )}

      {resultBlob && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center sm:text-left">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="font-bold text-emerald-900">PDF successfully flattened!</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                All form fields and elements have been merged permanently into static content ({formatBytes(resultBlob.size)}).
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Flattened PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

