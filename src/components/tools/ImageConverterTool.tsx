"use client";

import { useState, useRef } from "react";
import JSZip from "jszip";
import {
  Download,
  FileImage,
  LoaderCircle,
  Sparkles,
  Settings2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

type SupportedTarget = "image/jpeg" | "image/png" | "image/webp";

type ConvertedFile = {
  originalName: string;
  blob: Blob;
  previewUrl: string;
  outputName: string;
  outputSize: number;
  width: number;
  height: number;
};

export function ImageConverterTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<SupportedTarget>("image/png");
  const [quality, setQuality] = useState<number>(90);
  const [bgColor, setBgColor] = useState<string>("white");
  const [customBgColor, setCustomBgColor] = useState<string>("#ffffff");

  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ConvertedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setResults([]);
    setError(null);

    const list = Array.from(incoming).filter((f) => {
      const ext = f.name.toLowerCase();
      return (
        f.type.startsWith("image/") ||
        ext.endsWith(".webp") ||
        ext.endsWith(".svg") ||
        ext.endsWith(".bmp") ||
        ext.endsWith(".ico")
      );
    });

    if (list.length === 0) {
      setError("Please select at least one valid image file.");
      return;
    }

    setFiles(list);
  };

  const convertSingle = async (file: File): Promise<ConvertedFile> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${file.name}`));
      image.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not initialize 2D context.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Transparency handling for JPEG
    if (targetFormat === "image/jpeg") {
      ctx.fillStyle = bgColor === "custom" ? customBgColor : "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

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

    const ext = targetFormat === "image/jpeg" ? "jpg" : targetFormat === "image/webp" ? "webp" : "png";
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const outputName = `${baseName}.${ext}`;

    return {
      originalName: file.name,
      blob,
      previewUrl: URL.createObjectURL(blob),
      outputName,
      outputSize: blob.size,
      width: canvas.width,
      height: canvas.height,
    };
  };

  const convertAll = async () => {
    if (!files.length) return;
    setProcessing(true);
    setError(null);
    setResults([]);

    try {
      const convertedList: ConvertedFile[] = [];
      for (const f of files) {
        const res = await convertSingle(f);
        convertedList.push(res);
      }
      setResults(convertedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert images.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadAllZip = async () => {
    if (!results.length) return;
    const zip = new JSZip();
    for (const res of results) {
      zip.file(res.outputName, res.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, "converted-images.zip");
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      {!files.length ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-12 text-center transition hover:border-violet-400 hover:bg-violet-50/70 cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.webp,.svg,.bmp,.ico"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <RefreshCw className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Click or drag & drop images to convert
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Convert any image format (PNG, JPG, WEBP, BMP, SVG, GIF) into PNG, JPG, or WebP with adjustable quality.
          </p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Select Images
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <FileImage className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {files.length} {files.length === 1 ? "image" : "images"} selected
                </h3>
                <p className="text-xs text-slate-500">
                  Total size: {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
                </p>
              </div>
            </div>

            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Format */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Convert Format To</h3>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "image/png", label: "PNG", desc: "Lossless + Alpha transparency" },
                  { id: "image/jpeg", label: "JPG", desc: "Best for photos & web pages" },
                  { id: "image/webp", label: "WebP", desc: "High compression & web speed" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id as SupportedTarget)}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      targetFormat === fmt.id
                        ? "border-violet-500 bg-violet-50 font-bold text-violet-900 ring-1 ring-violet-500"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-bold">{fmt.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-1">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Background */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Quality & Options</h3>
              </div>

              {/* Quality Slider (for JPG & WebP) */}
              {targetFormat !== "image/png" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Image Quality</span>
                    <span className="font-bold text-violet-600">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Smaller file</span>
                    <span>Standard (90%)</span>
                    <span>Max quality</span>
                  </div>
                </div>
              )}

              {/* Background Color for JPG */}
              {targetFormat === "image/jpeg" && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700">
                    Background Color (Replaces Transparency)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBgColor("white")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        bgColor === "white"
                          ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      White (#FFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgColor("black")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        bgColor === "black"
                          ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Black (#000)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgColor("custom")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        bgColor === "custom"
                          ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Custom
                    </button>
                    {bgColor === "custom" && (
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Start Conversion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={convertAll}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Converting Images...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>
                        Convert {files.length} {files.length === 1 ? "Image" : "Images"} to{" "}
                        {targetFormat === "image/jpeg" ? "JPG" : targetFormat === "image/webp" ? "WebP" : "PNG"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Converted Results ({results.length})
                </h4>
                {results.length > 1 && (
                  <button
                    type="button"
                    onClick={downloadAllZip}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex h-36 items-center justify-center rounded-lg border border-slate-100 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] p-2">
                        <img
                          src={item.previewUrl}
                          alt={item.outputName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.outputName}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.width}×{item.height}px • {formatBytes(item.outputSize)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadBlob(item.blob, item.outputName)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

