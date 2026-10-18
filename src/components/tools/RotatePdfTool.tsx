"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Download, LoaderCircle, RotateCw } from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/browser-utils";

export function RotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("rotated.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(selected);
    setError(null);
  };

  const rotate = async () => {
    if (!file) {
      setError("Select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = source.getPages();
      pages.forEach((page) => {
        page.setRotation(degrees(Number(angle)));
      });
      const bytes = await source.save();
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-rotated-${angle}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotation failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-100 p-2 text-cyan-600"><RotateCw className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Rotate PDF</h2>
          <p className="text-sm text-slate-500">Rotate all pages in a PDF by a selected angle.</p>
        </div>
      </div>

      <input type="file" accept="application/pdf" onChange={(e) => handleFile(e.target.files)} className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm" />

      {file && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm text-slate-700">
            <span className="mb-2 block font-medium">Rotation angle</span>
            <select value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
              {[0, 90, 180, 270].map((option) => <option key={option} value={option}>{option}°</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={rotate} disabled={processing || !file} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-cyan-300">
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {processing ? "Rotating..." : "Rotate PDF"}
        </button>
        {file && <button type="button" onClick={() => setFile(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">Clear</button>}
      </div>

      {file && <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{file.name} • {formatBytes(file.size)}</div>}
      {resultBlob && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, downloadName)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Download rotated PDF
          </button>
        </div>
      )}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
