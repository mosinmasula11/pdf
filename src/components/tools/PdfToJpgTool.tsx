"use client";

import { useState } from "react";
import JSZip from "jszip";
import { Download, ImageDown, LoaderCircle } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function PdfToJpgTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("converted.zip");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setPageCount(null);
    const selected = incoming[0];
    setFile(selected);
    setResultBlob(null);
    setPageCount(null);
    setError(selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf") ? null : "Please choose a PDF file.");
  };

  const convert = async () => {
    if (!file) {
      setError("Select a PDF to convert.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      const pdfjs = pdfjsLib as typeof import("pdfjs-dist");

      const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const zip = new JSZip();
      const baseName = file.name.replace(/\.pdf$/i, "") || "converted";

      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is not available in this browser.");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error("Failed to convert a page to JPG."));
          }, "image/jpeg", 0.9);
        });

        zip.file(`${baseName}-page-${i}.jpg`, blob);
      }

      setPageCount(pdf.numPages);
      setResultBlob(await zip.generateAsync({ type: "blob" }));
      setDownloadName(`${baseName}.zip`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF conversion failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-600">
          <ImageDown className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">PDF to JPG</h2>
          <p className="text-sm text-slate-500">Export every page as a JPG image.</p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={convert}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-amber-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {processing ? "Extracting..." : "Convert to JPG ZIP"}
        </button>
        {file && (
          <button type="button" onClick={() => setFile(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">
            Clear
          </button>
        )}
      </div>

      {file && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-4">
            <span className="truncate">{file.name}</span>
            <span>{formatBytes(file.size)}</span>
          </div>
          {pageCount !== null && <div className="mt-2 text-slate-600">Pages extracted: {pageCount}</div>}
        </div>
      )}

      {resultBlob && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, downloadName)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Download JPG files (ZIP)
          </button>
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
