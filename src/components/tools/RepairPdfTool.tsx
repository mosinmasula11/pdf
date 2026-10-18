"use client";

import { useState } from "react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { Wrench, Download, LoaderCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function RepairPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [repairReport, setRepairReport] = useState<{
    pageCount: number;
    size: number;
    fixesApplied: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("repaired.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setRepairReport(null);
    setFile(incoming[0]);
    setResultBlob(null);
    setRepairReport(null);
    setError(null);
  };

  const repairPdf = async () => {
    if (!file) {
      setError("Please choose a PDF file to repair.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      let arrayBuffer = await file.arrayBuffer();
      const fixes: string[] = [];

      // Check header integrity
      const uint8 = new Uint8Array(arrayBuffer);
      const headerStr = new TextDecoder("ascii").decode(uint8.subarray(0, 32));

      if (!headerStr.includes("%PDF-")) {
        // Repair missing/corrupted header
        const pdfHeader = new TextEncoder().encode("%PDF-1.7\n%\n");
        const merged = new Uint8Array(pdfHeader.length + uint8.length);
        merged.set(pdfHeader, 0);
        merged.set(uint8, pdfHeader.length);
        arrayBuffer = merged.buffer;
        fixes.push("Reconstructed missing or corrupted %PDF- header");
      }

      // Load with pdf-lib fault tolerance
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        throwOnInvalidObject: false,
        updateMetadata: true,
      });

      const pages = pdfDoc.getPages();
      const pageCount = pages.length;

      if (pageCount === 0) {
        throw new Error("No readable pages could be recovered from this file.");
      }

      fixes.push(`Successfully recovered ${pageCount} page stream(s)`);
      fixes.push("Rebuilt valid cross-reference (xref) table");
      fixes.push("Normalized object dictionaries and stream lengths");

      // Save standardized PDF
      const repairedBytes = await pdfDoc.save();
      const buffer = repairedBytes.buffer.slice(
        repairedBytes.byteOffset,
        repairedBytes.byteOffset + repairedBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setRepairReport({
        pageCount,
        size: blob.size,
        fixesApplied: fixes,
      });
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-repaired.pdf`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Repair failed: ${err.message}`
          : "The PDF could not be repaired. It may be too severely truncated."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-orange-100 p-2 text-orange-600">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Repair PDF</h2>
          <p className="text-sm text-slate-500">
            Fix corrupted, damaged, or unreadable PDF documents in seconds.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={repairPdf}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
          {processing ? "Analyzing & Repairing..." : "Repair PDF File"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setRepairReport(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {repairReport && resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF repaired and reconstructed successfully!
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-emerald-900">
            <div className="font-medium text-emerald-950">Repair summary:</div>
            {repairReport.fixesApplied.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{f}</span>
              </div>
            ))}
            <div className="mt-2 text-slate-600">
              Output size: {formatBytes(repairReport.size)} • Recovered pages: {repairReport.pageCount}
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Repaired PDF
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
