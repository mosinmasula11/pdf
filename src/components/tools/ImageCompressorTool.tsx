"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function ImageCompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.75);
  const [outputType, setOutputType] = useState<"image/jpeg" | "image/webp" | "image/png">("image/jpeg");
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("compressed.jpg");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    const allowed = ["image/jpeg", "image/png", "image/webp"]; 
    if (!allowed.includes(selected.type) && !/(png|jpg|jpeg|webp)$/i.test(selected.name)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }

    setFile(selected);
    setOriginalSize(selected.size);
    setOutputSize(null);
    setPreviewUrl(null);
    setError(null);
  };

  const compress = async () => {
    if (!file) {
      setError("Choose an image file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available.");

      context.drawImage(imageBitmap, 0, 0);
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Compression failed."));
          },
          outputType,
          quality,
        );
      });

      const preview = URL.createObjectURL(compressedBlob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return preview;
      });
      setOutputSize(compressedBlob.size);
      setResultBlob(compressedBlob);
      setDownloadName(`${file.name.replace(/\.[^/.]+$/, "") || "compressed"}.${outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-600">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Compress Image</h2>
          <p className="text-sm text-slate-500">Reduce file size while keeping quality high.</p>
        </div>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="mb-2 block font-medium text-slate-700">Quality</span>
            <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full" />
            <div className="mt-2 text-right text-slate-600">{quality.toFixed(2)}</div>
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="mb-2 block font-medium text-slate-700">Output format</span>
            <select value={outputType} onChange={(e) => setOutputType(e.target.value as "image/jpeg" | "image/webp" | "image/png")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800">
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/png">PNG</option>
            </select>
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={compress}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
          {processing ? "Compressing..." : "Compress Image"}
        </button>
        {file && (
          <button type="button" onClick={() => setFile(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">
            Clear
          </button>
        )}
      </div>

      {originalSize !== null && outputSize !== null && (
        <div className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3">Original: {formatBytes(originalSize)}</div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">Compressed: {formatBytes(outputSize)}</div>
        </div>
      )}

      {resultBlob && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, downloadName)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Download compressed image
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <img src={previewUrl} alt="Compressed preview" className="max-h-72 w-full object-contain bg-slate-50" />
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
