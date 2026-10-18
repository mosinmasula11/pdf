"use client";

import { useState } from "react";
import JSZip from "jszip";
import { Archive, Download, FileImage, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

type ConvertedImage = {
  originalName: string;
  blob: Blob;
  previewUrl: string;
  outputName: string;
};

export function WebpToJpgTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(90);
  const [targetFormat, setTargetFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ConvertedImage[]>([]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setResults([]);
    setError(null);

    const list = Array.from(incoming).filter((f) => {
      const ext = f.name.toLowerCase();
      return f.type === "image/webp" || ext.endsWith(".webp") || f.type.startsWith("image/");
    });

    if (list.length === 0) {
      setError("Please select at least one WebP or image file.");
      return;
    }

    setFiles(list);
  };

  const convertFiles = async () => {
    if (!files.length) return;
    setProcessing(true);
    setError(null);
    setResults([]);

    try {
      const convertedList: ConvertedImage[] = [];

      for (const file of files) {
        const imageBitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not initialize image canvas.");

        if (targetFormat === "image/jpeg") {
          // Fill white background for JPEG transparency handling
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(imageBitmap, 0, 0);

        const ext = targetFormat === "image/jpeg" ? "jpg" : "png";
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const outputName = `${baseName}.${ext}`;

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error("Image conversion failed."));
            },
            targetFormat,
            quality / 100
          );
        });

        convertedList.push({
          originalName: file.name,
          blob,
          previewUrl: URL.createObjectURL(blob),
          outputName,
        });
      }

      setResults(convertedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert images.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadAllAsZip = async () => {
    if (!results.length) return;
    const zip = new JSZip();

    results.forEach((item) => {
      zip.file(item.outputName, item.blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    downloadBlob(content, `webp-converted-${Date.now()}.zip`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-100 p-2 text-sky-600">
          <FileImage className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">WebP to JPG / PNG Converter</h2>
          <p className="text-sm text-slate-500">
            Convert WebP images to high-quality JPG or PNG files locally in your browser.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <input
          type="file"
          accept="image/webp,image/*,.webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="webp-file-input"
        />
        <label
          htmlFor="webp-file-input"
          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          {files.length > 0 ? "Select different images" : "Select WebP images"}
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Supports single files or batch conversion. Processed 100% locally with zero server uploads.
        </p>

        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800">
              {files.length} {files.length === 1 ? "image selected" : "images selected"}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && results.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-600">Conversion Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target Output Format</label>
              <div className="flex gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 has-checked:border-violet-600 has-checked:bg-violet-50 has-checked:text-violet-700">
                  <input
                    type="radio"
                    name="targetFormat"
                    value="image/jpeg"
                    checked={targetFormat === "image/jpeg"}
                    onChange={() => setTargetFormat("image/jpeg")}
                    className="sr-only"
                  />
                  JPG / JPEG
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 has-checked:border-violet-600 has-checked:bg-violet-50 has-checked:text-violet-700">
                  <input
                    type="radio"
                    name="targetFormat"
                    value="image/png"
                    checked={targetFormat === "image/png"}
                    onChange={() => setTargetFormat("image/png")}
                    className="sr-only"
                  />
                  PNG (Lossless)
                </label>
              </div>
            </div>

            {targetFormat === "image/jpeg" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">JPG Quality</label>
                  <span className="text-xs font-bold text-violet-700">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>Smaller size</span>
                  <span>Highest quality</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={convertFiles}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Convert to {targetFormat === "image/jpeg" ? "JPG" : "PNG"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-bold text-slate-900">Converted {results.length} images</p>
              <p className="text-xs text-slate-500">Ready for instant local download.</p>
            </div>
            {results.length > 1 && (
              <button
                type="button"
                onClick={downloadAllAsZip}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Archive className="h-3.5 w-3.5" />
                Download all as ZIP
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.outputName}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{item.outputName}</p>
                    <p className="text-[11px] text-slate-500">{formatBytes(item.blob.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadBlob(item.blob, item.outputName)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

