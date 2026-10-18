"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileImage, LoaderCircle, Sparkles } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function JpgToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter((file) => /image\/(png|jpeg|jpg)/.test(file.type));
    setFiles(next);
    setError(next.length === 0 ? "Please choose JPG or PNG images." : null);
  };

  const convert = async () => {
    if (!files.length) {
      setError("Select at least one JPG or PNG image.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;

        if (file.type === "image/png") {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          throw new Error(`Unsupported format: ${file.name}`);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const bytes = await pdfDoc.save();
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      setOutputSize(blob.size);
      downloadBlob(blob, `converted-${Date.now()}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <FileImage className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">JPG to PDF</h2>
          <p className="text-sm text-slate-500">Combine images into a single PDF.</p>
        </div>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={convert}
          disabled={processing || !files.length}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {processing ? "Converting..." : "Convert to PDF"}
        </button>
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => setFiles([])}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-medium text-slate-900">Selected files</div>
          <ul className="mt-2 space-y-1">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex justify-between gap-4">
                <span className="truncate">{file.name}</span>
                <span>{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {outputSize !== null && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>Output size</span>
          <span className="font-semibold">{formatBytes(outputSize)}</span>
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
