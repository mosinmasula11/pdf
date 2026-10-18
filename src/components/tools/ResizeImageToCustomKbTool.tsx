"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Scissors, SlidersHorizontal } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

type OutputMode = "image/jpeg" | "image/png" | "image/webp";

function toExtension(mode: OutputMode) {
  if (mode === "image/png") return "png";
  if (mode === "image/webp") return "webp";
  return "jpg";
}

export function ResizeImageToCustomKbTool() {
  const [file, setFile] = useState<File | null>(null);
  const [targetKb, setTargetKb] = useState(100);
  const [outputMode, setOutputMode] = useState<OutputMode>("image/jpeg");
  const [quality, setQuality] = useState(0.72);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [lockAspect, setLockAspect] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aspectRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      aspectRef.current = img.width / img.height;
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (!/image\/(png|jpeg|jpg|webp)/.test(selected.type) && !/(png|jpg|jpeg|webp)$/i.test(selected.name)) {
      setError("Use a JPG, PNG, or WebP file.");
      return;
    }

    setFile(selected);
    setOriginalSize(selected.size);
    setOutputSize(null);
    setPreviewUrl(null);
    setError(null);
  };

  const resizeAndDownload = async () => {
    if (!file || width === null || height === null) {
      setError("Choose an image and set dimensions.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not read image."));
        image.src = objectUrl;
      });

      const targetBytes = targetKb * 1024;
      let bestCandidate: { blob: Blob; size: number; width: number; height: number; quality: number } | null = null;

      for (let q = 0.95; q >= 0.15; q -= 0.05) {
        for (let scale = 1; scale >= 0.35; scale -= 0.05) {
          const finalWidth = Math.max(1, Math.round(img.width * scale));
          const finalHeight = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = finalWidth;
          canvas.height = finalHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is not supported.");
          context.drawImage(img, 0, 0, finalWidth, finalHeight);

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
              if (result) resolve(result);
              else reject(new Error("Encoding failed."));
            }, outputMode, q);
          });

          if (blob.size <= targetBytes) {
            bestCandidate = {
              blob,
              size: blob.size,
              width: finalWidth,
              height: finalHeight,
              quality: q,
            };
            break;
          }
        }

        if (bestCandidate) break;
      }

      if (!bestCandidate) {
        throw new Error("The target size could not be reached with the current image. Try a lower target or allow more compression.");
      }

      const preview = URL.createObjectURL(bestCandidate.blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return preview;
      });
      setOutputSize(bestCandidate.size);
      downloadBlob(bestCandidate.blob, `optimized-${Date.now()}.${toExtension(outputMode)}`);

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed.");
    } finally {
      setProcessing(false);
    }
  };

  const updateDimension = (field: "width" | "height", value: number) => {
    if (field === "width") {
      setWidth(value);
      if (lockAspect && aspectRef.current) {
        setHeight(Math.max(1, Math.round(value / aspectRef.current)));
      }
    } else {
      setHeight(value);
      if (lockAspect && aspectRef.current) {
        setWidth(Math.max(1, Math.round(value * aspectRef.current)));
      }
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <Scissors className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resize Image to Custom KB</h2>
          <p className="text-sm text-slate-500">Optimize for portal uploads and exact size requirements.</p>
        </div>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mb-2 block font-medium text-slate-700">Target size</span>
              <select value={targetKb} onChange={(e) => setTargetKb(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800">
                {[10, 20, 30, 50, 100, 200, 500].map((size) => (
                  <option key={size} value={size}>{size} KB</option>
                ))}
                <option value={750}>750 KB</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mb-2 block font-medium text-slate-700">Output format</span>
              <select value={outputMode} onChange={(e) => setOutputMode(e.target.value as OutputMode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Dimensions</span>
              <button type="button" onClick={() => setLockAspect((prev) => !prev)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                {lockAspect ? "Aspect locked" : "Aspect unlocked"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Width</span>
                <input type="number" min="1" value={width ?? 0} onChange={(e) => updateDimension("width", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Height</span>
                <input type="number" min="1" value={height ?? 0} onChange={(e) => updateDimension("height", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
              </label>
            </div>
          </div>

          <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="mb-2 block font-medium text-slate-700">Compression quality</span>
            <input type="range" min="0.15" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full" />
            <div className="mt-2 text-right text-slate-600">{quality.toFixed(2)}</div>
          </label>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={resizeAndDownload}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
          {processing ? "Optimizing..." : `Optimize to ${targetKb} KB`}
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
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">Optimized: {formatBytes(outputSize)}</div>
        </div>
      )}

      {previewUrl && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <img src={previewUrl} alt="Optimized preview" className="max-h-72 w-full object-contain bg-slate-50" />
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
