"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { Download, FileOutput, LoaderCircle, CheckSquare, Square, Archive } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function ExtractPagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [extractMode, setExtractMode] = useState<"single" | "separate">("single");
  const [rangeInput, setRangeInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("extracted-pages.pdf");

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const total = pdf.getPageCount();
      setFile(selected);
      setPageCount(total);
      // Pre-select first page
      setSelectedPages(new Set([1]));
      setRangeInput("1");
      setResultBlob(null);
      setError(null);
    } catch (err) {
      setFile(null);
      setPageCount(null);
      setError(err instanceof Error ? err.message : "Could not open this PDF file.");
    }
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!pageCount) return;
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const applyRangeInput = () => {
    if (!pageCount || !rangeInput.trim()) return;
    const next = new Set<number>();
    const parts = rangeInput.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(pageCount, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            next.add(p);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= pageCount) {
          next.add(num);
        }
      }
    }
    setSelectedPages(next);
  };

  const extract = async () => {
    if (!file || !pageCount) {
      setError("Please choose a PDF file first.");
      return;
    }
    if (selectedPages.size === 0) {
      setError("Please select at least one page to extract.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
      const baseName = file.name.replace(/\.pdf$/i, "");

      if (extractMode === "single") {
        const destDoc = await PDFDocument.create();
        const indices = sortedPages.map((p) => p - 1);
        const copied = await destDoc.copyPages(srcDoc, indices);
        copied.forEach((p) => destDoc.addPage(p));

        const bytes = await destDoc.save();
        const buffer = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;

        const blob = new Blob([buffer], { type: "application/pdf" });
        setResultBlob(blob);
        setDownloadName(`${baseName}-extracted.pdf`);
      } else {
        // Separate PDF files into a ZIP
        const zip = new JSZip();

        for (const p of sortedPages) {
          const pageDoc = await PDFDocument.create();
          const [copiedPage] = await pageDoc.copyPages(srcDoc, [p - 1]);
          pageDoc.addPage(copiedPage);

          const bytes = await pageDoc.save();
          const buffer = bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ) as ArrayBuffer;

          zip.file(`${baseName}-page-${p}.pdf`, buffer);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        setResultBlob(zipBlob);
        setDownloadName(`${baseName}-extracted-pages.zip`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <FileOutput className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Extract Pages from PDF</h2>
          <p className="text-sm text-slate-500">
            Export specific pages into a new PDF or individual files.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && pageCount !== null && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> ({formatBytes(file.size)}) • Total {pageCount} pages
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${extractMode === "single" ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200"}`}>
              <input
                type="radio"
                name="extractMode"
                checked={extractMode === "single"}
                onChange={() => setExtractMode("single")}
                className="text-indigo-600"
              />
              <div>
                <span className="block font-semibold text-slate-900 text-sm">Extract into 1 PDF</span>
                <span className="block text-xs text-slate-500">Combines selected pages into a single document</span>
              </div>
            </label>

            <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${extractMode === "separate" ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200"}`}>
              <input
                type="radio"
                name="extractMode"
                checked={extractMode === "separate"}
                onChange={() => setExtractMode("separate")}
                className="text-indigo-600"
              />
              <div>
                <span className="block font-semibold text-slate-900 text-sm">Extract as separate PDFs</span>
                <span className="block text-xs text-slate-500">Creates individual PDFs bundled in a ZIP archive</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Type page numbers or range to extract (e.g. 1-3, 5):
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                placeholder="e.g. 1, 3-5"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={applyRangeInput}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>{selectedPages.size} of {pageCount} pages selected</span>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-indigo-600 font-semibold hover:underline">Select all</button>
                <span>•</span>
                <button type="button" onClick={clearSelection} className="text-slate-600 hover:underline">Clear</button>
              </div>
            </div>
            <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                const isSelected = selectedPages.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePage(p)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {isSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5 text-slate-400" />}
                    Page {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={extract}
          disabled={processing || !file || selectedPages.size === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : extractMode === "separate" ? <Archive className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {processing ? "Extracting..." : `Extract ${selectedPages.size} Pages`}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setSelectedPages(new Set());
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Extraction complete!
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download {extractMode === "separate" ? "ZIP Archive" : "Extracted PDF"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

