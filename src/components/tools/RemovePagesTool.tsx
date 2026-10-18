"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Trash2, Download, LoaderCircle, CheckSquare, Square } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function RemovePagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("pages-removed.pdf");

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
      setSelectedPages(new Set());
      setRangeInput("");
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

  const removePages = async () => {
    if (!file || !pageCount) {
      setError("Please choose a PDF file first.");
      return;
    }
    if (selectedPages.size === 0) {
      setError("Select at least one page to remove.");
      return;
    }
    if (selectedPages.size >= pageCount) {
      setError("You cannot remove all pages. At least one page must remain.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Sort descending to avoid index shifting
      const sortedIndicesToRemove = Array.from(selectedPages)
        .map((p) => p - 1)
        .sort((a, b) => b - a);

      for (const index of sortedIndicesToRemove) {
        pdfDoc.removePage(index);
      }

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(
        `${file.name.replace(/\.pdf$/i, "")}-removed-${selectedPages.size}-pages.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove pages.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-rose-100 p-2 text-rose-600">
          <Trash2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Remove Pages from PDF</h2>
          <p className="text-sm text-slate-500">
            Select the pages you want to delete and keep the rest.
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
            <span className="font-semibold text-slate-900">{file.name}</span> ({formatBytes(file.size)}) • Total {pageCount} {pageCount === 1 ? "page" : "pages"}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Type page numbers or range to delete (e.g. 1, 3-5):
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                placeholder="e.g. 2, 4-6"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-500"
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
              <span>Click a page to mark for deletion:</span>
              <span>{selectedPages.size} marked to delete, {pageCount - selectedPages.size} remaining</span>
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
                        ? "border-rose-500 bg-rose-50 text-rose-700"
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
          onClick={removePages}
          disabled={processing || !file || selectedPages.size === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-rose-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {processing ? "Removing..." : `Remove ${selectedPages.size} Selected Pages`}
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
            Pages removed successfully!
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Modified PDF
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

