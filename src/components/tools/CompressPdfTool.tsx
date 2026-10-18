"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Minimize2, LoaderCircle, CheckCircle2, Sparkles } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { getPdfJs } from "@/lib/pdfjs-helper";

export function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<"recommended" | "extreme" | "low">("recommended");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [downloadName, setDownloadName] = useState("compressed.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setCompressedSize(null);
    setError(null);
  };

  const compressPdf = async () => {
    if (!file) {
      setError("Please select a PDF to compress.");
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress("Initializing PDF engine...");

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = srcDoc.numPages;

      let scale = 1.25;
      let quality = 0.7;

      if (compressionLevel === "extreme") {
        scale = 1.0;
        quality = 0.5;
      } else if (compressionLevel === "low") {
        scale = 1.5;
        quality = 0.85;
      }

      const destPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Compressing page ${i} of ${totalPages}...`);
        const page = await srcDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is not supported in this browser.");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        const imgDataUrl = canvas.toDataURL("image/jpeg", quality);
        const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
        const embeddedImg = await destPdf.embedJpg(imgBytes);

        // Retain original page dimensions
        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = destPdf.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }

      setProgress("Finalizing compressed document...");
      const pdfBytes = await destPdf.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setCompressedSize(blob.size);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF compression failed.");
    } finally {
      setProcessing(false);
      setProgress("");
    }
  };

  const percentSaved =
    file && compressedSize !== null && file.size > 0
      ? Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100))
      : 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-600">
          <Minimize2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Compress PDF</h2>
          <p className="text-sm text-slate-500">
            Reduce PDF file size while optimizing for the best visual quality.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> • Original size: <span className="font-semibold text-slate-900">{formatBytes(file.size)}</span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Select compression level:
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  id: "extreme",
                  title: "Extreme Compression",
                  desc: "Smallest size, lower image resolution",
                },
                {
                  id: "recommended",
                  title: "Recommended",
                  desc: "Good balance of quality and size",
                },
                {
                  id: "low",
                  title: "Low Compression",
                  desc: "Highest quality, mild size reduction",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
                    compressionLevel === opt.id
                      ? "border-amber-500 bg-amber-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{opt.title}</span>
                    <input
                      type="radio"
                      name="compressionLevel"
                      value={opt.id}
                      checked={compressionLevel === opt.id}
                      onChange={() => setCompressionLevel(opt.id as any)}
                      className="text-amber-600"
                    />
                  </div>
                  <span className="mt-1 text-xs text-slate-500">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={compressPdf}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {processing ? progress || "Compressing..." : "Compress PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setCompressedSize(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {resultBlob && compressedSize !== null && file && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF compressed successfully!
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-emerald-900">
            <div>
              Before: <span className="font-bold">{formatBytes(file.size)}</span>
            </div>
            <div>→</div>
            <div>
              After: <span className="font-bold">{formatBytes(compressedSize)}</span>
            </div>
            {percentSaved > 0 && (
              <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                Saved {percentSaved}%
              </span>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Compressed PDF
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

