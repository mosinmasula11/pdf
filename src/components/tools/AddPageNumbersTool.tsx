"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Hash, Download, LoaderCircle, CheckCircle2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
type FormatPattern = "page-n-of-total" | "n-of-total" | "page-n" | "n" | "dash-n";

export function AddPageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<FormatPattern>("page-n-of-total");
  const [startNum, setStartNum] = useState<number>(1);
  const [skipCover, setSkipCover] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(10);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("numbered.pdf");

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
      setFile(selected);
      setPageCount(pdf.getPageCount());
      setResultBlob(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF.");
    }
  };

  const getPageText = (n: number, total: number) => {
    switch (format) {
      case "page-n-of-total":
        return `Page ${n} of ${total}`;
      case "n-of-total":
        return `${n} / ${total}`;
      case "page-n":
        return `Page ${n}`;
      case "n":
        return `${n}`;
      case "dash-n":
        return `- ${n} -`;
    }
  };

  const addNumbers = async () => {
    if (!file || !pageCount) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const margin = 30;

      pages.forEach((page, index) => {
        if (skipCover && index === 0) return;

        const pageNum = startNum + (skipCover ? index - 1 : index);
        const total = skipCover ? pageCount - 1 : pageCount;
        const text = getPageText(pageNum, total);

        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x = (width - textWidth) / 2;
        let y = margin;

        switch (position) {
          case "bottom-center":
            x = (width - textWidth) / 2;
            y = margin;
            break;
          case "bottom-right":
            x = width - margin - textWidth;
            y = margin;
            break;
          case "bottom-left":
            x = margin;
            y = margin;
            break;
          case "top-center":
            x = (width - textWidth) / 2;
            y = height - margin;
            break;
          case "top-right":
            x = width - margin - textWidth;
            y = height - margin;
            break;
          case "top-left":
            x = margin;
            y = height - margin;
            break;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.3, 0.35, 0.4),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-numbered.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add page numbers.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <Hash className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Add Page Numbers to PDF</h2>
          <p className="text-sm text-slate-500">
            Insert customizable page numbers, footers or headers with precision.
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
            <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)} ({pageCount} pages)
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Position on page:
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="bottom-center">Bottom Center (Footer)</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-center">Top Center (Header)</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Numbering style:
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatPattern)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="page-n-of-total">Page 1 of {pageCount}</option>
                <option value="n-of-total">1 / {pageCount}</option>
                <option value="page-n">Page 1</option>
                <option value="n">1 (Number only)</option>
                <option value="dash-n">- 1 -</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Start numbering from:
              </label>
              <input
                type="number"
                min={1}
                value={startNum}
                onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Font size:
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value={9}>Small (9 pt)</option>
                <option value={10}>Medium (10 pt)</option>
                <option value={12}>Standard (12 pt)</option>
                <option value={14}>Large (14 pt)</option>
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={skipCover}
              onChange={(e) => setSkipCover(e.target.checked)}
              className="rounded text-violet-600"
            />
            Skip numbering on first page (Cover Page)
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addNumbers}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
          {processing ? "Stamping Numbers..." : "Add Page Numbers"}
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
            Page numbers added successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Numbered PDF
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

