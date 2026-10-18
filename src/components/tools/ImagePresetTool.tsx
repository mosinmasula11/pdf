"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function ImagePresetTool({ kind }: { kind: "passport" | "signature" }) {
  const photo = kind === "passport";
  const [selectedName, setSelectedName] = useState("");
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [width, setWidth] = useState(photo ? 413 : 300);
  const [height, setHeight] = useState(photo ? 531 : 100);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [trim, setTrim] = useState(!photo);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [maxKb, setMaxKb] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => image?.close(), [image]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    setResult(null);
    setError("");
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4000 || height > 4000) {
      setError("Choose whole-number dimensions between 1 and 4000 pixels.");
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    let sx = 0, sy = 0, sw = image.width, sh = image.height;
    if (!photo && trim) {
      const source = document.createElement("canvas");
      source.width = image.width;
      source.height = image.height;
      const input = source.getContext("2d", { willReadFrequently: true });
      if (!input) return;
      input.drawImage(image, 0, 0);
      const { data } = input.getImageData(0, 0, source.width, source.height);
      let left = sw, top = sh, right = -1, bottom = -1;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        if (data[i + 3] > 30 && Math.min(data[i], data[i + 1], data[i + 2]) < 225) {
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      if (right < left) { setError("No visible signature was found in this image."); return; }
      sx = Math.max(0, left - 5); sy = Math.max(0, top - 5);
      sw = Math.min(image.width - sx, right - sx + 6);
      sh = Math.min(image.height - sy, bottom - sy + 6);
    }
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    if (photo) {
      const ratio = width / height;
      if (sw / sh > ratio) { const crop = sh * ratio; sx += (sw - crop) * horizontal / 100; sw = crop; }
      else { const crop = sw / ratio; sy += (sh - crop) * vertical / 100; sh = crop; }
      context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
    } else {
      const scale = Math.min(width / sw, height / sh);
      const dw = sw * scale, dh = sh * scale;
      context.drawImage(image, sx, sy, sw, sh, (width - dw) / 2, (height - dh) / 2, dw, dh);
    }
    });
    return () => cancelAnimationFrame(frame);
  }, [image, width, height, horizontal, vertical, trim, photo, format, maxKb]);

  const load = async (file?: File) => {
    setError(""); setResult(null);
    if (!file) { setError("No image was selected."); return; }
    setSelectedName(file.name);
    try {
      const next = await createImageBitmap(file);
      if (next.width * next.height > 40000000) { next.close(); throw new Error("Choose an image with fewer than 40 million pixels."); }
      setImage(next);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not read image."); }
  };

  const encode = (quality = 0.92) => new Promise<Blob>((resolve, reject) => {
    canvasRef.current?.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export image.")), format, quality);
  });

  const exportImage = async () => {
    if (!image || error) return;
    setBusy(true); setResult(null);
    try {
      let blob = await encode();
      if (maxKb > 0 && blob.size > maxKb * 1024) {
        if (format !== "image/jpeg") throw new Error("Use JPG for a file-size limit, or increase the PNG size limit.");
        let low = 0.05, high = 0.92;
        let best = await encode(low);
        if (best.size > maxKb * 1024) throw new Error("This limit is too small for these dimensions. Reduce the dimensions or increase the limit.");
        for (let i = 0; i < 8; i++) {
          const quality = (low + high) / 2, candidate = await encode(quality);
          if (candidate.size <= maxKb * 1024) { best = candidate; low = quality; } else high = quality;
        }
        blob = best;
      }
      setResult(blob);
    } catch (error) { setError(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(false); }
  };

  const printSheet = async () => {
    if (!image || error || !canvasRef.current) return;
    setBusy(true);
    try {
      const document = await PDFDocument.create();
      const blob = await encode();
      const bytes = await blob.arrayBuffer();
      const embedded = format === "image/png" ? await document.embedPng(bytes) : await document.embedJpg(bytes);
      const page = document.addPage([288, 432]);
      const w = width * 72 / 300, h = height * 72 / 300;
      if (w > 268 || h > 412) throw new Error("The photo is too large for a 4 × 6 inch sheet at 300 DPI.");
      for (let y = 10; y + h <= 422; y += h + 8) for (let x = 10; x + w <= 278; x += w + 8) {
        page.drawImage(embedded, { x, y, width: w, height: h });
        page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.25 });
      }
      downloadBlob(new Blob([new Uint8Array(await document.save()).buffer], { type: "application/pdf" }), "passport-print-sheet.pdf");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not create print sheet."); }
    finally { setBusy(false); }
  };

  const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2";
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">{photo ? "Passport Photo Maker" : "Signature Resizer"}</h2>
    <p className="mt-2 text-sm text-slate-600">{photo ? "Crop an existing photo and create a 300 DPI print sheet. The original background is preserved." : "Trim white space and fit your signature to portal dimensions without stretching it."}</p>
    <label className="mt-5 block text-sm font-medium">Choose image
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => void load(e.target.files?.[0])} className={inputClass} />
    </label>
    {selectedName && <p className="mt-2 text-sm text-slate-600">Selected: {selectedName}</p>}
    {image && <>
      {photo && <label className="mt-4 block text-sm">Photo size
        <select className={inputClass} onChange={(e) => { const [w, h] = e.target.value.split("x").map(Number); setWidth(w); setHeight(h); }} defaultValue="413x531">
          <option value="413x531">35 × 45 mm (300 DPI)</option><option value="600x600">2 × 2 inches (300 DPI)</option><option value="390x567">33 × 48 mm (300 DPI)</option>
        </select>
      </label>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Width (pixels)<input type="number" min="1" max="4000" value={width} disabled={busy} onChange={(e) => setWidth(Number(e.target.value))} className={inputClass} /></label>
        <label className="text-sm">Height (pixels)<input type="number" min="1" max="4000" value={height} disabled={busy} onChange={(e) => setHeight(Number(e.target.value))} className={inputClass} /></label>
        <label className="text-sm">Output format<select value={format} disabled={busy} onChange={(e) => setFormat(e.target.value as typeof format)} className={inputClass}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label>
        <label className="text-sm">Maximum file size (KB, 0 for no limit)<input type="number" min="0" value={maxKb} disabled={busy} onChange={(e) => setMaxKb(Math.max(0, Number(e.target.value)))} className={inputClass} /></label>
      </div>
      {photo ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Horizontal crop position<input type="range" min="0" max="100" value={horizontal} disabled={busy} onChange={(e) => setHorizontal(Number(e.target.value))} className="block w-full" /></label>
        <label className="text-sm">Vertical crop position<input type="range" min="0" max="100" value={vertical} disabled={busy} onChange={(e) => setVertical(Number(e.target.value))} className="block w-full" /></label>
      </div> : <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={trim} disabled={busy} onChange={(e) => setTrim(e.target.checked)} />Trim white space around signature</label>}
      <div className="mt-5 rounded-xl bg-slate-100 p-4"><canvas ref={canvasRef} className="mx-auto max-h-80 max-w-full object-contain" aria-label="Output preview" /></div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={busy || Boolean(error)} onClick={() => void exportImage()} className="rounded-xl bg-violet-600 px-4 py-2 text-white disabled:opacity-50">{busy ? "Processing..." : "Create image"}</button>
        {photo && <button type="button" disabled={busy || Boolean(error)} onClick={() => void printSheet()} className="rounded-xl border px-4 py-2 disabled:opacity-50">Download 4 × 6 print sheet</button>}
      </div>
      {result && <div className="mt-4"><p className="text-sm">{width} × {height} pixels · {formatBytes(result.size)}</p><button type="button" onClick={() => downloadBlob(result, `${kind}.${format === "image/png" ? "png" : "jpg"}`)} className="mt-2 rounded-xl bg-violet-600 px-4 py-2 text-white">Download image</button></div>}
    </>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
  </section>;
}
