"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Crop, Download, LoaderCircle, CheckCircle2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function CropPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [topTrim, setTopTrim] = useState<number>(20);
  const [bottomTrim, setBottomTrim] = useState<number>(20);
  const [leftTrim, setLeftTrim] = useState<number>(20);
  const [rightTrim, setRightTrim] = useState<number>(20);
  const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("cropped.pdf");

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const firstPage = pdf.getPage(0);
      const { width, height } = firstPage.getSize();
      setFile(selected);
      setPageDims({ width: Math.round(width), height: Math.round(height) });
      setResultBlob(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF.");
    }
  };

  const applyPreset = (preset: "edges" | "header-footer" | "reset") => {
    if (preset === "edges") {
      setTopTrim(15);
      setBottomTrim(15);
      setLeftTrim(15);
      setRightTrim(15);
    } else if (preset === "header-footer") {
      setTopTrim(45);
      setBottomTrim(45);
      setLeftTrim(10);
      setRightTrim(10);
    } else {
      setTopTrim(0);
      setBottomTrim(0);
      setLeftTrim(0);
      setRightTrim(0);
    }
  };

  const cropPdf = async () => {
    if (!file || !pageDims) {
      setError("Please select a PDF file first.");
      return;
    }

    if (
      leftTrim + rightTrim >= pageDims.width ||
      topTrim + bottomTrim >= pageDims.height
    ) {
      setError("Trim margins exceed the page dimensions! Please choose smaller margins.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const newX = leftTrim;
        const newY = bottomTrim;
        const newWidth = Math.max(10, width - leftTrim - rightTrim);
        const newHeight = Math.max(10, height - topTrim - bottomTrim);

        page.setCropBox(newX, newY, newWidth, newHeight);
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-cropped.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to crop PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-600">
          <Crop className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Crop PDF</h2>
          <p className="text-sm text-slate-500">
            Trim margins and adjust document page boundaries with precision.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && pageDims && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)} (Size: {pageDims.width} × {pageDims.height} pt)
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyPreset("edges")}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Trim Edges (15pt)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("header-footer")}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cut Header/Footer
              </button>
              <button
                type="button"
                onClick={() => applyPreset("reset")}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Top Trim: {topTrim} pt
              </label>
              <input
                type="number"
                min={0}
                max={Math.floor(pageDims.height / 2)}
                value={topTrim}
                onChange={(e) => setTopTrim(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Bottom Trim: {bottomTrim} pt
              </label>
              <input
                type="number"
                min={0}
                max={Math.floor(pageDims.height / 2)}
                value={bottomTrim}
                onChange={(e) => setBottomTrim(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Left Trim: {leftTrim} pt
              </label>
              <input
                type="number"
                min={0}
                max={Math.floor(pageDims.width / 2)}
                value={leftTrim}
                onChange={(e) => setLeftTrim(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Right Trim: {rightTrim} pt
              </label>
              <input
                type="number"
                min={0}
                max={Math.floor(pageDims.width / 2)}
                value={rightTrim}
                onChange={(e) => setRightTrim(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={cropPdf}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />}
          {processing ? "Cropping Margins..." : "Crop PDF Document"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF cropped successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Cropped PDF
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
