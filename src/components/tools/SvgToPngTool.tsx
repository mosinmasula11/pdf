"use client";

import { useState, useRef } from "react";
import JSZip from "jszip";
import {
  Download,
  FileCode,
  FileImage,
  LoaderCircle,
  Sparkles,
  Settings2,
  Trash2,
  Check,
  ZoomIn,
} from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { svgOutputSize, uniqueImageName } from "@/lib/image-output";

type ConvertedSvg = {
  originalName: string;
  blob: Blob;
  previewUrl: string;
  outputName: string;
  width: number;
  height: number;
  fileSize: number;
};

export function SvgToPngTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [scale, setScale] = useState<number>(2);
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [customBgColor, setCustomBgColor] = useState<string>("#ffffff");
  const [quality, setQuality] = useState<number>(92);

  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ConvertedSvg[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setResults([]);
    setError(null);

    const list = Array.from(incoming).filter((f) => {
      const ext = f.name.toLowerCase();
      return f.type === "image/svg+xml" || ext.endsWith(".svg");
    });

    if (list.length === 0) {
      setError("Please select at least one SVG file.");
      return;
    }

    setFiles(list);
  };

  const convertSvgFile = async (file: File): Promise<ConvertedSvg> => {
    const text = await file.text();
    const svgBlob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<ConvertedSvg>((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const originalW = img.naturalWidth || 300;
          const originalH = img.naturalHeight || 150;

          const { width: targetW, height: targetH } = svgOutputSize(originalW, originalH, scale, customWidth, customHeight, maintainAspect);

          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not initialize 2D context.");

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Background fill
          const effectiveBg =
            outputFormat === "image/jpeg"
              ? bgColor === "transparent" ? "#ffffff" : (bgColor === "custom" ? customBgColor : "#ffffff")
              : bgColor === "custom"
              ? customBgColor
              : bgColor === "white"
              ? "#ffffff"
              : "transparent";

          if (effectiveBg !== "transparent") {
            ctx.fillStyle = effectiveBg;
            ctx.fillRect(0, 0, targetW, targetH);
          }

          ctx.drawImage(img, 0, 0, targetW, targetH);
          URL.revokeObjectURL(url);

          const blob = await new Promise<Blob>((resBlob, rejBlob) => {
            canvas.toBlob(
              (b) => {
                if (b) resBlob(b);
                else rejBlob(new Error("Raster rendering failed."));
              },
              outputFormat,
              quality / 100
            );
          });

          if (blob.type !== outputFormat) throw new Error("This browser does not support the selected output format.");
          const ext = outputFormat === "image/jpeg" ? "jpg" : outputFormat === "image/webp" ? "webp" : "png";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const outputName = `${baseName}.${ext}`;

          resolve({
            originalName: file.name,
            blob,
            previewUrl: URL.createObjectURL(blob),
            outputName,
            width: targetW,
            height: targetH,
            fileSize: blob.size,
          });
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load SVG: ${file.name}`));
      };

      img.src = url;
    });
  };

  const convertAll = async () => {
    if (!files.length) return;
    setProcessing(true);
    setError(null);
    setResults([]);

    try {
      const convertedList: ConvertedSvg[] = [];
      const usedNames = new Set<string>();
      for (const file of files) {
        const item = await convertSvgFile(file);
        item.outputName = uniqueImageName(item.outputName, usedNames);
        convertedList.push(item);
      }
      setResults(convertedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert SVGs.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadAllAsZip = async () => {
    if (!results.length) return;
    const zip = new JSZip();
    for (const res of results) {
      zip.file(res.outputName, res.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, "converted-svg-images.zip");
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
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
            accept=".svg,image/svg+xml"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <FileCode className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Click or drag & drop SVG vector files
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Convert scalable vector graphics to high-resolution PNG, JPG, or WebP at 1×, 2×, 4×, or custom dimensions.
          </p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Select SVG Files
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {files.length} {files.length === 1 ? "SVG file" : "SVG files"} loaded
                </h3>
                <p className="text-xs text-slate-500">
                  {files.map((f) => f.name).join(", ").slice(0, 60)}
                  {files.length > 2 ? "..." : ""}
                </p>
              </div>
            </div>

            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Files</span>
            </button>
          </div>

          {/* Controls Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resolution & Scale */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Output Resolution & Scale</h3>
              </div>

              {/* Scale Multiplier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Quick Scale Factor</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 1, label: "1×", desc: "Native" },
                    { val: 2, label: "2×", desc: "Retina" },
                    { val: 4, label: "4×", desc: "Crisp Print" },
                    { val: 8, label: "8×", desc: "Ultra HD" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => {
                        setScale(s.val);
                        setCustomWidth("");
                        setCustomHeight("");
                      }}
                      className={`p-2 rounded-lg border text-center text-xs transition ${
                        scale === s.val && !customWidth
                          ? "border-violet-500 bg-violet-50 font-bold text-violet-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-sm font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Pixel Dimensions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700">Custom Dimensions (Optional)</label>
                  <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={maintainAspect} onChange={e => setMaintainAspect(e.target.checked)} />Maintain aspect ratio</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Width (px)</span>
                    <input
                      type="number"
                      placeholder="Auto"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Height (px)</span>
                    <input
                      type="number"
                      placeholder="Auto"
                      value={customHeight}
                      disabled={maintainAspect && !!customWidth}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Format & Background */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Format & Styling</h3>
              </div>

              {/* Target Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Output Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "image/png", label: "PNG", desc: "Transparent Alpha" },
                    { id: "image/jpeg", label: "JPG", desc: "Solid Background" },
                    { id: "image/webp", label: "WebP", desc: "Compact Modern" },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setOutputFormat(fmt.id as any)}
                      className={`p-2 rounded-lg border text-left text-xs transition ${
                        outputFormat === fmt.id
                          ? "border-violet-500 bg-violet-50 font-bold text-violet-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">{fmt.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Background Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {outputFormat !== "image/jpeg" && (
                    <button
                      type="button"
                      onClick={() => setBgColor("transparent")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        bgColor === "transparent"
                          ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Transparent
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setBgColor("white")}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      bgColor === "white" || (outputFormat === "image/jpeg" && bgColor === "transparent")
                        ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    White
                  </button>
                  <div className="flex items-center gap-1.5">
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
              </div>

              {/* Convert Action Button */}
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
                      <span>Converting {files.length} SVG files...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>
                        Convert {files.length} {files.length === 1 ? "SVG" : "SVGs"} to{" "}
                        {outputFormat === "image/jpeg" ? "JPG" : outputFormat === "image/webp" ? "WebP" : "PNG"}
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
                    onClick={downloadAllAsZip}
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
                          {item.width}×{item.height}px • {formatBytes(item.fileSize)}
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

