"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Download, LayoutGrid, LoaderCircle, ArrowLeft, ArrowRight, RotateCw, Trash2, RotateCcw } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
}

export function OrganizePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("organized.pdf");

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

      const initialPages: PageItem[] = Array.from({ length: total }, (_, i) => ({
        id: `page-${i + 1}-${Date.now()}-${Math.random()}`,
        originalIndex: i,
        rotation: 0,
      }));

      setFile(selected);
      setPages(initialPages);
      setResultBlob(null);
      setError(null);
    } catch (err) {
      setFile(null);
      setPages([]);
      setError(err instanceof Error ? err.message : "Could not open this PDF file.");
    }
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const rotatePage = (index: number) => {
    setPages((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        rotation: (next[index].rotation + 90) % 360,
      };
      return next;
    });
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setError("At least one page must remain in the document.");
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const resetPages = async () => {
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const total = pdf.getPageCount();
      const reset = Array.from({ length: total }, (_, i) => ({
        id: `page-${i + 1}-${Date.now()}`,
        originalIndex: i,
        rotation: 0,
      }));
      setPages(reset);
      setError(null);
    } catch {
      // ignore
    }
  };

  const saveOrganized = async () => {
    if (!file || pages.length === 0) {
      setError("Please select a PDF with pages to organize.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const destDoc = await PDFDocument.create();

      for (const item of pages) {
        const [copiedPage] = await destDoc.copyPages(srcDoc, [item.originalIndex]);
        if (item.rotation > 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + item.rotation) % 360));
        }
        destDoc.addPage(copiedPage);
      }

      const bytes = await destDoc.save();
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-organized.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to organize PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-teal-100 p-2 text-teal-600">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Organize PDF Pages</h2>
          <p className="text-sm text-slate-500">
            Reorder, rotate, or delete individual pages visually.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && pages.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">{file.name}</span> ({formatBytes(file.size)}) • {pages.length} pages
            </div>
            <button
              type="button"
              onClick={resetPages}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset order
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {pages.map((item, index) => (
              <div
                key={item.id}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:border-teal-400 transition"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                    #{index + 1}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Orig #{item.originalIndex + 1}
                  </span>
                </div>

                <div className="my-2 flex h-24 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-500">
                  <div
                    className="transition-transform duration-200 flex flex-col items-center justify-center"
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                  >
                    <span>Page {item.originalIndex + 1}</span>
                    {item.rotation > 0 && (
                      <span className="text-[10px] text-teal-600">({item.rotation}°)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePage(index, index - 1)}
                      title="Move left"
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      onClick={() => movePage(index, index + 1)}
                      title="Move right"
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => rotatePage(index)}
                      title="Rotate 90°"
                      className="rounded p-1 text-teal-600 hover:bg-teal-50"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePage(index)}
                      title="Delete page"
                      className="rounded p-1 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveOrganized}
          disabled={processing || !file || pages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {processing ? "Saving..." : "Save Organized PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPages([]);
              setResultBlob(null);
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
            PDF organized successfully!
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Organized PDF
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

