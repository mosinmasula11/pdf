"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Stamp, Download, LoaderCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function AddWatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState<number>(48);
  const [rotation, setRotation] = useState<number>(45);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [colorPreset, setColorPreset] = useState<"gray" | "red" | "blue">("red");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("watermarked.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setError(null);
  };

  const handleImageFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setImageFile(incoming[0]);
  };

  const addWatermark = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      if (watermarkType === "text") {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let color = rgb(0.5, 0.5, 0.5);
        if (colorPreset === "red") color = rgb(0.85, 0.15, 0.15);
        if (colorPreset === "blue") color = rgb(0.15, 0.35, 0.85);

        for (const page of pages) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = font.heightAtSize(fontSize);

          // Center watermark
          page.drawText(watermarkText, {
            x: (width - textWidth) / 2,
            y: (height - textHeight) / 2,
            size: fontSize,
            font,
            color,
            opacity,
            rotate: degrees(rotation),
          });
        }
      } else {
        if (!imageFile) {
          throw new Error("Please upload an image to use as a watermark.");
        }
        const imgBuffer = await imageFile.arrayBuffer();
        const img =
          imageFile.type === "image/png"
            ? await pdfDoc.embedPng(imgBuffer)
            : await pdfDoc.embedJpg(imgBuffer);

        for (const page of pages) {
          const { width, height } = page.getSize();
          // Scale watermark image to fit nicely in center
          const maxDim = Math.min(width, height) * 0.5;
          const scale = maxDim / Math.max(img.width, img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;

          page.drawImage(img, {
            x: (width - drawW) / 2,
            y: (height - drawH) / 2,
            width: drawW,
            height: drawH,
            opacity,
            rotate: degrees(rotation),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add watermark.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-rose-100 p-2 text-rose-600">
          <Stamp className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Add Watermark to PDF</h2>
          <p className="text-sm text-slate-500">
            Stamp a custom text or logo image over your PDF pages.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
          </div>

          <div className="flex gap-3">
            <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${watermarkType === "text" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-slate-200 text-slate-600"}`}>
              <input
                type="radio"
                name="watermarkType"
                checked={watermarkType === "text"}
                onChange={() => setWatermarkType("text")}
                className="text-rose-600"
              />
              Text Watermark
            </label>
            <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${watermarkType === "image" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-slate-200 text-slate-600"}`}>
              <input
                type="radio"
                name="watermarkType"
                checked={watermarkType === "image"}
                onChange={() => setWatermarkType("image")}
                className="text-rose-600"
              />
              Image / Logo Watermark
            </label>
          </div>

          {watermarkType === "text" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Watermark text:
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Color:
                </label>
                <select
                  value={colorPreset}
                  onChange={(e) => setColorPreset(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="red">Red (Warning/Confidential)</option>
                  <option value="gray">Gray (Subtle)</option>
                  <option value="blue">Blue (Corporate)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Font size: {fontSize} pt
                </label>
                <input
                  type="range"
                  min={20}
                  max={90}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={15}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Choose watermark logo image (PNG or JPG):
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => handleImageFile(e.target.files)}
                className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Opacity / Transparency: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min={0.05}
              max={1.0}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addWatermark}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Stamp className="h-4 w-4" />}
          {processing ? "Stamping Watermark..." : "Stamp Watermark"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Watermark applied successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Watermarked PDF
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

