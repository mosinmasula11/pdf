"use client";

import { useMemo, useState } from "react";
import { Download, Image as ImageIcon, LoaderCircle } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function ResizeImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [lockAspect, setLockAspect] = useState(true);
  const [quality, setQuality] = useState(0.85);
  const [outputType, setOutputType] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("resized.jpg");

  const accepted = useMemo(() => ["image/jpeg", "image/png", "image/webp"], []);

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setOutputSize(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    const selected = incoming[0];
    if (!accepted.includes(selected.type) && !/(png|jpg|jpeg|webp)$/i.test(selected.name)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }

    const url = URL.createObjectURL(selected);
    const image = new Image();
    image.onload = () => {
      setFile(selected);
      setOriginalSize(selected.size);
      setOutputSize(null);
      setError(null);
      setImageMeta({ width: image.width, height: image.height });
      setWidth(Math.max(1, image.width));
      setHeight(Math.max(1, image.height));
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    };
    image.onerror = () => {
      setError("The selected image could not be loaded.");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const resize = async () => {
    if (!file) {
      setError("Select an image first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read image."));
        img.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Image resize failed."));
          },
          outputType,
          quality,
        );
      });

      const nextUrl = URL.createObjectURL(result);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      setOutputSize(result.size);
      setResultBlob(result);
      setDownloadName(`resized-${Date.now()}.${outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg"}`);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resize failed.");
    } finally {
      setProcessing(false);
    }
  };

  const updateDimension = (target: "width" | "height", value: number) => {
    if (target === "width") {
      setWidth(value);
      if (lockAspect && imageMeta) {
        const ratio = imageMeta.width / imageMeta.height;
        setHeight(Math.max(1, Math.round(value / ratio)));
      }
      return;
    }

    setHeight(value);
    if (lockAspect && imageMeta) {
      const ratio = imageMeta.width / imageMeta.height;
      setWidth(Math.max(1, Math.round(value * ratio)));
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600"><ImageIcon className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resize Image</h2>
          <p className="text-sm text-slate-500">Adjust pixel dimensions quickly and export the new image.</p>
        </div>
      </div>

      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleFile(e.target.files)} className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm" />

      {file && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mb-2 block font-medium text-slate-700">Width</span>
              <input type="number" min="1" value={width} onChange={(e) => updateDimension("width", Number(e.target.value) || 1)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mb-2 block font-medium text-slate-700">Height</span>
              <input type="number" min="1" value={height} onChange={(e) => updateDimension("height", Number(e.target.value) || 1)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mb-2 block font-medium text-slate-700">Output format</span>
              <select value={outputType} onChange={(e) => setOutputType(e.target.value as "image/jpeg" | "image/png" | "image/webp")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mb-2 block font-medium text-slate-700">Quality</span>
              <input type="range" min="0.2" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full" />
              <div className="mt-2 text-right text-slate-600">{quality.toFixed(2)}</div>
            </label>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <span>Lock aspect ratio</span>
            <button type="button" onClick={() => setLockAspect((prev) => !prev)} className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-medium">
              {lockAspect ? "Locked" : "Unlocked"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={resize} disabled={processing || !file} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-violet-300">
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {processing ? "Resizing..." : "Resize image"}
        </button>
        {file && <button type="button" onClick={() => setFile(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">Clear</button>}
      </div>

      {originalSize !== null && outputSize !== null && (
        <div className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3">Original: {formatBytes(originalSize)}</div>
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">Output: {formatBytes(outputSize)}</div>
        </div>
      )}

      {resultBlob && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, downloadName)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Download resized image
          </button>
        </div>
      )}

      {previewUrl && <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><img src={previewUrl} alt="Resized preview" className="max-h-72 w-full object-contain bg-slate-50" /></div>}

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
