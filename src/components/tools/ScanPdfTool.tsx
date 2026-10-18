"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Camera, Download, LoaderCircle, Trash2, Plus, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";

interface ScannedPage {
  id: string;
  dataUrl: string;
  filter: "normal" | "grayscale" | "threshold";
}

export function ScanPdfTool() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [filterMode, setFilterMode] = useState<"normal" | "grayscale" | "threshold">("grayscale");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("scanned-document.pdf");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setError(
        "Camera access denied or unavailable. You can also upload photos of documents directly."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const applyCanvasFilter = (
    srcCanvas: HTMLCanvasElement,
    mode: "normal" | "grayscale" | "threshold"
  ): string => {
    const ctx = srcCanvas.getContext("2d");
    if (!ctx) return srcCanvas.toDataURL("image/jpeg", 0.85);

    if (mode === "normal") {
      return srcCanvas.toDataURL("image/jpeg", 0.85);
    }

    const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // luminance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (mode === "grayscale") {
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      } else if (mode === "threshold") {
        // High-contrast clean black & white document
        const v = gray > 140 ? 255 : 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return srcCanvas.toDataURL("image/jpeg", 0.85);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const filteredUrl = applyCanvasFilter(canvas, filterMode);

    setPages((prev) => [
      ...prev,
      {
        id: `scan-${Date.now()}-${Math.random()}`,
        dataUrl: filteredUrl,
        filter: filterMode,
      },
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const filtered = applyCanvasFilter(canvas, filterMode);

          setPages((prev) => [
            ...prev,
            {
              id: `scan-${Date.now()}-${Math.random()}`,
              dataUrl: filtered,
              filter: filterMode,
            },
          ]);
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const generatePdf = async () => {
    if (pages.length === 0) {
      setError("Please capture or upload at least one page.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const p of pages) {
        // Convert dataUrl to bytes
        const res = await fetch(p.dataUrl);
        const imgBytes = await res.arrayBuffer();
        const image = await pdfDoc.embedJpg(imgBytes);

        // Standard A4: 595.28 x 841.89 points
        const a4Width = 595.28;
        const a4Height = 841.89;
        const page = pdfDoc.addPage([a4Width, a4Height]);

        // Scale image to fit inside A4 margins (margin = 20pt)
        const margin = 20;
        const maxWidth = a4Width - margin * 2;
        const maxHeight = a4Height - margin * 2;

        const imgRatio = image.width / image.height;
        const targetRatio = maxWidth / maxHeight;

        let drawW = maxWidth;
        let drawH = drawW / imgRatio;

        if (imgRatio < targetRatio) {
          drawH = maxHeight;
          drawW = drawH * imgRatio;
        }

        const posX = margin + (maxWidth - drawW) / 2;
        const posY = margin + (maxHeight - drawH) / 2;

        page.drawImage(image, {
          x: posX,
          y: posY,
          width: drawW,
          height: drawH,
        });
      }

      const bytes = await pdfDoc.save();
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`scanned-doc-${Date.now()}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compile scanned PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-600">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Scan to PDF</h2>
          <p className="text-sm text-slate-500">
            Use your camera or upload photos to create a clean multi-page document PDF.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>Preset filter:</span>
          {(["grayscale", "threshold", "normal"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`rounded-lg px-2 py-0.5 capitalize transition ${
                filterMode === mode
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mode === "threshold" ? "B&W Document" : mode}
            </button>
          ))}
        </div>
      </div>

      {cameraActive ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-80 w-full object-contain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <Camera className="h-4 w-4" />
              Capture Page #{pages.length + 1}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Stop Camera
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
          >
            <Camera className="h-4 w-4" />
            Open Camera Scanner
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100">
            <ImageIcon className="h-4 w-4 text-slate-500" />
            Upload Document Photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {pages.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="text-sm font-semibold text-slate-800">
            Scanned Pages ({pages.length})
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((p, index) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-lg bg-white">
                  <img
                    src={p.dataUrl}
                    alt={`Scanned page ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Page {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removePage(p.id)}
                    className="rounded p-1 text-rose-500 hover:bg-rose-50"
                    title="Delete page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={generatePdf}
          disabled={processing || pages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {processing ? "Compiling PDF..." : `Save as PDF (${pages.length} Pages)`}
        </button>

        {pages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPages([]);
              setResultBlob(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear all
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Document PDF ready!
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Scanned PDF
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

