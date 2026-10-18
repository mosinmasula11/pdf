"use client";

import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { PenSquare, Download, LoaderCircle, CheckCircle2, RotateCcw, Upload, Type, Edit } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

type SignMode = "draw" | "type" | "upload";

export function SignPdfTool() {
  const [file, setFile] = useState < File | null > (null);
  const [pageCount, setPageCount] = useState < number | null > (null);
  const [signMode, setSignMode] = useState < SignMode > ("draw");
  const [typedName, setTypedName] = useState("John Doe");
  const [targetPage, setTargetPage] = useState < number > (1);
  const [sigPosition, setSigPosition] = useState < "bottom-right" | "bottom-left" | "bottom-center" > ("bottom-right");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState < string | null > (null);
  const [resultBlob, setResultBlob] = useState < Blob | null > (null);
  const [downloadName, setDownloadName] = useState("signed.pdf");

  const sigCanvasRef = useRef < HTMLCanvasElement | null > (null);
  const isDrawing = useRef(false);
  const lastPos = useRef < { x: number; y: number } | null > (null);
  const uploadedSigRef = useRef < string | null > (null);

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const total = pdf.getPageCount();
      setFile(selected);
      setPageCount(total);
      setTargetPage(total); // Default to last page for signature
      setResultBlob(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF.");
    }
  };

  const handleSigMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isDrawing.current = true;
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleSigMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e3a8a"; // dark blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();

    lastPos.current = { x, y };
  };

  const handleSigMouseUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedSigRef.current = String(reader.result);
    };
    reader.readAsDataURL(f);
  };

  const getSignaturePngBytes = async (): Promise<ArrayBuffer> => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");

    if (signMode === "draw") {
      const drawnCanvas = sigCanvasRef.current;
      if (!drawnCanvas) throw new Error("Signature pad is empty.");
      ctx.drawImage(drawnCanvas, 0, 0, canvas.width, canvas.height);
    } else if (signMode === "type") {
      ctx.font = "italic 44px cursive, serif";
      ctx.fillStyle = "#1e3a8a";
      ctx.fillText(typedName || "Signature", 20, 90);
      ctx.strokeStyle = "#1e3a8a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(15, 110);
      ctx.lineTo(360, 110);
      ctx.stroke();
    } else {
      if (!uploadedSigRef.current) throw new Error("Please upload a signature image first.");
      const img = new Image();
      await new Promise < void> ((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = reject;
        img.src = uploadedSigRef.current!;
      });
    }

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    return res.arrayBuffer();
  };

  const signPdf = async () => {
    if (!file || !pageCount) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const sigPngBytes = await getSignaturePngBytes();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const embeddedSig = await pdfDoc.embedPng(sigPngBytes);

      const pageIndex = Math.max(0, Math.min(pageCount - 1, targetPage - 1));
      const page = pdfDoc.getPage(pageIndex);
      const { width } = page.getSize();

      const sigWidth = 160;
      const sigHeight = 60;
      const margin = 40;

      let x = width - sigWidth - margin;
      const y = margin + 20;

      if (sigPosition === "bottom-left") {
        x = margin;
      } else if (sigPosition === "bottom-center") {
        x = (width - sigWidth) / 2;
      }

      page.drawImage(embeddedSig, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-signed.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-100 p-2 text-blue-600">
          <PenSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sign PDF Online</h2>
          <p className="text-sm text-slate-500">
            Create your electronic signature and stamp it securely onto any page of your PDF.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && pageCount !== null && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)} ({pageCount} pages)
          </div>

          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setSignMode("draw")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${signMode === "draw" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              <Edit className="h-3.5 w-3.5" />
              Draw Signature
            </button>
            <button
              type="button"
              onClick={() => setSignMode("type")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${signMode === "type" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              <Type className="h-3.5 w-3.5" />
              Type Name
            </button>
            <button
              type="button"
              onClick={() => setSignMode("upload")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${signMode === "upload" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Image
            </button>
          </div>

          {signMode === "draw" && (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Draw your signature below using mouse or touchscreen:</span>
                <button
                  type="button"
                  onClick={clearSigCanvas}
                  className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear pad
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                <canvas
                  ref={sigCanvasRef}
                  width={500}
                  height={150}
                  onMouseDown={handleSigMouseDown}
                  onMouseMove={handleSigMouseMove}
                  onMouseUp={handleSigMouseUp}
                  onMouseLeave={handleSigMouseUp}
                  className="w-full cursor-crosshair bg-white"
                />
              </div>
            </div>
          )}

          {signMode === "type" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Your full name:
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-center font-serif italic text-3xl text-blue-900">
                {typedName || "Signature"}
              </div>
            </div>
          )}

          {signMode === "upload" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Upload signature image (transparent PNG recommended):
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleSigUpload}
                className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs"
              />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Stamp on page:
              </label>
              <select
                value={targetPage}
                onChange={(e) => setTargetPage(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    Page {p} {p === pageCount ? "(Last Page)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Signature position:
              </label>
              <select
                value={sigPosition}
                onChange={(e) => setSigPosition(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={signPdf}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PenSquare className="h-4 w-4" />}
          {processing ? "Signing PDF..." : "Sign Document"}
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
            PDF signed successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Signed PDF
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

