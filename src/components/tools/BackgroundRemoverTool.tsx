"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eraser,
  Pipette,
  RotateCcw,
  Sliders,
  Upload,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/browser-utils";

interface RgbColor {
  r: number;
  g: number;
  g_val?: number;
  b: number;
}

export function BackgroundRemoverTool() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  // Background removal settings
  const [targetColor, setTargetColor] = useState<RgbColor>({ r: 255, g: 255, b: 255 });
  const [tolerance, setTolerance] = useState(28); // 0 to 100
  const [feather, setFeather] = useState(12); // 0 to 30
  const [mode, setMode] = useState<"connected" | "global">("connected"); // connected (flood fill) vs global
  const [eyedropperActive, setEyedropperActive] = useState(false);

  // Background replacement
  const [bgType, setBgType] = useState<"transparent" | "color">("transparent");
  const [replaceColor, setReplaceColor] = useState("#ffffff");

  // View & Processing
  const [viewMode, setViewMode] = useState<"processed" | "split" | "original">("processed");
  const [splitPos, setSplitPos] = useState(50); // 0 to 100
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read uploaded image
  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });

      // Create an offscreen canvas to analyze corners for auto-detection
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Sample 4 corners and borders
        const p1 = ctx.getImageData(2, 2, 1, 1).data;
        const p2 = ctx.getImageData(img.naturalWidth - 3, 2, 1, 1).data;
        const p3 = ctx.getImageData(2, img.naturalHeight - 3, 1, 1).data;
        const p4 = ctx.getImageData(img.naturalWidth - 3, img.naturalHeight - 3, 1, 1).data;

        // Average corner colors
        const avgR = Math.round((p1[0] + p2[0] + p3[0] + p4[0]) / 4);
        const avgG = Math.round((p1[1] + p2[1] + p3[1] + p4[1]) / 4);
        const avgB = Math.round((p1[2] + p2[2] + p3[2] + p4[2]) / 4);
        setTargetColor({ r: avgR, g: avgG, b: avgB });
      }
    };
    img.src = url;
  };

  // Convert Hex to RGB
  const hexToRgb = (hex: string): RgbColor => {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  // Color distance formula (Euclidean RGB distance normalized 0..441.67)
  const getColorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  // Main Background Removal Processing
  const processImage = useCallback(() => {
    if (!imageSrc || !imgDimensions) return;
    setProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Draw original canvas
      const origCanvas = originalCanvasRef.current;
      if (origCanvas) {
        origCanvas.width = width;
        origCanvas.height = height;
        const oCtx = origCanvas.getContext("2d");
        if (oCtx) oCtx.drawImage(img, 0, 0);
      }

      // Target canvas
      const canvas = canvasRef.current;
      if (!canvas) {
        setProcessing(false);
        return;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const maxDist = (tolerance / 100) * 442;
      const featherDist = (feather / 100) * 442;

      const tr = targetColor.r;
      const tg = targetColor.g;
      const tb = targetColor.b;

      if (mode === "global") {
        // Global color keying across the entire image
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const dist = getColorDistance(r, g, b, tr, tg, tb);

          if (dist <= maxDist) {
            data[i + 3] = 0; // completely transparent
          } else if (dist < maxDist + featherDist) {
            // Feathered soft edge
            const alphaFactor = (dist - maxDist) / featherDist;
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        }
      } else {
        // Connected mode: BFS flood fill starting from all 4 borders
        // Only pixels connected to the borders matching the target color are removed
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Helper to get index
        const getIdx = (x: number, y: number) => y * width + x;

        // Push top and bottom borders
        for (let x = 0; x < width; x++) {
          queue.push(getIdx(x, 0));
          queue.push(getIdx(x, height - 1));
          visited[getIdx(x, 0)] = 1;
          visited[getIdx(x, height - 1)] = 1;
        }

        // Push left and right borders
        for (let y = 1; y < height - 1; y++) {
          queue.push(getIdx(0, y));
          queue.push(getIdx(width - 1, y));
          visited[getIdx(0, y)] = 1;
          visited[getIdx(width - 1, y)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % width;
          const cy = Math.floor(curr / width);
          const pIdx = curr * 4;

          const r = data[pIdx];
          const g = data[pIdx + 1];
          const b = data[pIdx + 2];
          const dist = getColorDistance(r, g, b, tr, tg, tb);

          if (dist <= maxDist) {
            // Completely transparent background pixel
            data[pIdx + 3] = 0;

            // Expand to 4 neighbors
            const neighbors = [
              cx > 0 ? getIdx(cx - 1, cy) : -1,
              cx < width - 1 ? getIdx(cx + 1, cy) : -1,
              cy > 0 ? getIdx(cx, cy - 1) : -1,
              cy < height - 1 ? getIdx(cx, cy + 1) : -1,
            ];

            for (const n of neighbors) {
              if (n !== -1 && !visited[n]) {
                visited[n] = 1;
                queue.push(n);
              }
            }
          } else if (dist < maxDist + featherDist) {
            // Soft border pixel: don't expand further, but feather alpha
            const alphaFactor = (dist - maxDist) / featherDist;
            data[pIdx + 3] = Math.round(data[pIdx + 3] * alphaFactor);
          }
        }
      }

      // If replacement background is chosen, composite it
      if (bgType === "color") {
        const repRgb = hexToRgb(replaceColor);
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] / 255;
          if (a < 1) {
            data[i] = Math.round(data[i] * a + repRgb.r * (1 - a));
            data[i + 1] = Math.round(data[i + 1] * a + repRgb.g * (1 - a));
            data[i + 2] = Math.round(data[i + 2] * a + repRgb.b * (1 - a));
            data[i + 3] = 255;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessing(false);
    };
    img.src = imageSrc;
  }, [imageSrc, imgDimensions, targetColor, tolerance, feather, mode, bgType, replaceColor]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  // Eyedropper click handler on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!eyedropperActive || !originalCanvasRef.current) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const origCtx = originalCanvasRef.current.getContext("2d");
    if (!origCtx) return;

    const pixel = origCtx.getImageData(x, y, 1, 1).data;
    setTargetColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    setEyedropperActive(false);
  };

  // Download Output
  const handleDownload = (format: "png" | "webp" | "jpg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mime = format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, "") : "image";

    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${baseName}-nobg.${format}`);
      }
    }, mime, 0.95);
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      {!imageSrc ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-12 text-center transition hover:border-violet-400 hover:bg-violet-50/20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-xs mb-4">
            <Eraser className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Upload Image to Remove Background</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Works best with product photos, logos, signatures, and studio portraits. Supports JPG, PNG, and WebP.
          </p>

          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-95">
            <Upload className="h-4 w-4" /> Select Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Preview & Viewport */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
              {/* View mode toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("processed")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    viewMode === "processed"
                      ? "bg-white text-violet-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Removed BG
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    viewMode === "split"
                      ? "bg-white text-violet-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Before / After
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("original")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    viewMode === "original"
                      ? "bg-white text-violet-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Original
                </button>
              </div>

              {/* Eyedropper Button */}
              <button
                type="button"
                onClick={() => setEyedropperActive(!eyedropperActive)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  eyedropperActive
                    ? "bg-violet-600 text-white shadow-xs animate-pulse"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Pipette className="h-3.5 w-3.5" />
                {eyedropperActive ? "Click on Canvas to Sample" : "Pick Color from Image"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImageSrc(null);
                  setImgDimensions(null);
                }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Change Image
              </button>
            </div>

            {/* Canvas Viewer Container with Checkerboard Background */}
            <div
              className={`relative flex min-h-[360px] max-h-[560px] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 p-4 transition ${
                bgType === "transparent"
                  ? "bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[size:16px_16px]"
                  : ""
              }`}
              style={bgType === "color" ? { backgroundColor: replaceColor } : {}}
            >
              {/* Processed Canvas */}
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-sm ${
                  eyedropperActive ? "cursor-crosshair" : ""
                } ${viewMode === "original" ? "hidden" : "block"}`}
                style={
                  viewMode === "split"
                    ? { clipPath: `inset(0 ${100 - splitPos}% 0 0)` }
                    : {}
                }
              />

              {/* Original Canvas for Split Mode or Original View */}
              <canvas
                ref={originalCanvasRef}
                onClick={handleCanvasClick}
                className={`max-h-[500px] w-auto max-w-full rounded-xl object-contain ${
                  viewMode === "split"
                    ? "absolute pointer-events-none"
                    : viewMode === "original"
                    ? "block"
                    : "hidden"
                }`}
                style={
                  viewMode === "split"
                    ? { clipPath: `inset(0 0 0 ${splitPos}%)` }
                    : {}
                }
              />

              {/* Split Mode Slider Line */}
              {viewMode === "split" && (
                <div
                  className="absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md text-slate-700 text-[10px] font-bold">
                    ↔
                  </div>
                </div>
              )}
            </div>

            {/* Split Slider Control */}
            {viewMode === "split" && (
              <div className="flex items-center gap-3 px-2 text-xs text-slate-500">
                <span>Removed BG</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={splitPos}
                  onChange={(e) => setSplitPos(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <span>Original</span>
              </div>
            )}

            {/* Image Specs */}
            {imgDimensions && (
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>{file?.name}</span>
                <span>
                  {imgDimensions.width} × {imgDimensions.height} px • {file ? formatBytes(file.size) : ""}
                </span>
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-violet-600" /> Detection &amp; Removal
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Fine-tune which background colors to eliminate.
              </p>
            </div>

            {/* Target Color Swatch & Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Target Background Color</label>
              <div className="flex items-center gap-2">
                <div
                  className="h-9 w-12 rounded-xl border border-slate-300 shadow-inner"
                  style={{ backgroundColor: rgbToHex(targetColor.r, targetColor.g, targetColor.b) }}
                />
                <input
                  type="color"
                  value={rgbToHex(targetColor.r, targetColor.g, targetColor.b)}
                  onChange={(e) => setTargetColor(hexToRgb(e.target.value))}
                  className="h-9 w-14 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-1"
                />
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {rgbToHex(targetColor.r, targetColor.g, targetColor.b)}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "White", hex: "#ffffff" },
                  { label: "Black", hex: "#000000" },
                  { label: "Light Gray", hex: "#f3f4f6" },
                  { label: "Green Screen", hex: "#00ff00" },
                  { label: "Blue Screen", hex: "#0000ff" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTargetColor(hexToRgb(preset.hex))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tolerance Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Color Tolerance: <strong className="text-violet-600">{tolerance}%</strong></span>
                <span className="text-slate-400">Match radius</span>
              </div>
              <input
                type="range"
                min={1}
                max={90}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="mt-2 w-full accent-violet-600"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>Strict (Exact color)</span>
                <span>Default</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Edge Feathering Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Edge Smoothing / Feather: <strong className="text-violet-600">{feather}%</strong></span>
                <span className="text-slate-400">Anti-aliasing</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="mt-2 w-full accent-violet-600"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Softens borders to eliminate jagged pixel halos.
              </p>
            </div>

            {/* Removal Mode: Connected vs Global */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Scope of Removal</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("connected")}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    mode === "connected"
                      ? "border-violet-600 bg-violet-50/50 text-violet-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-xs font-bold">Edge Flood Fill</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Preserves matching colors inside foreground objects
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("global")}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    mode === "global"
                      ? "border-violet-600 bg-violet-50/50 text-violet-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-xs font-bold">Global Color</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Removes matching color everywhere across image
                  </span>
                </button>
              </div>
            </div>

            {/* Output Background */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Replacement Background</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBgType("transparent")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                    bgType === "transparent"
                      ? "border-violet-600 bg-violet-50 text-violet-800"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="h-3 w-3 rounded-full bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#fff_0%_50%)] bg-[size:4px_4px] border border-slate-300" />
                  Transparent (PNG)
                </button>

                <button
                  type="button"
                  onClick={() => setBgType("color")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                    bgType === "color"
                      ? "border-violet-600 bg-violet-50 text-violet-800"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-slate-300 shadow-xs"
                    style={{ backgroundColor: replaceColor }}
                  />
                  Custom Solid Color
                </button>
              </div>

              {bgType === "color" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={replaceColor}
                    onChange={(e) => setReplaceColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-1"
                  />
                  <span className="font-mono text-xs text-slate-600">{replaceColor}</span>
                  <div className="flex gap-1 ml-auto">
                    {["#ffffff", "#000000", "#1e293b", "#3b82f6", "#ef4444"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setReplaceColor(c)}
                        className="h-6 w-6 rounded-md border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Downloads */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <span className="block text-xs font-bold text-slate-700">Download Result</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload("png")}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" /> PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("webp")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-3.5 w-3.5" /> WebP
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("jpg")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-3.5 w-3.5" /> JPG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
