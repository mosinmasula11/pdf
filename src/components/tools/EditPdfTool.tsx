"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Edit3, Download, LoaderCircle, CheckCircle2, Type, PenTool, Highlighter, Undo, Trash2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { getPdfJs } from "@/lib/pdfjs-helper";

type ToolMode = "draw" | "highlight" | "text";

interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export function EditPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [toolMode, setToolMode] = useState<ToolMode>("draw");
  const [brushColor, setBrushColor] = useState<string>("#2563eb");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [textInput, setTextInput] = useState<string>("Sample Note");
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("edited.pdf");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await selected.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setFile(selected);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setTextAnnotations([]);
      setResultBlob(null);
      setError(null);
      renderPagePreview(selected, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF.");
    }
  };

  const renderPagePreview = async (pdfFile: File, pageNum: number) => {
    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (file) {
      renderPagePreview(file, currentPage);
    }
  }, [currentPage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === "text") {
      if (!textInput.trim()) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = "16px sans-serif";
      ctx.fillStyle = brushColor;
      ctx.fillText(textInput, x, y);
      setTextAnnotations((prev) => [
        ...prev,
        { x, y, text: textInput, color: brushColor, size: 16 },
      ]);
      return;
    }

    isDrawing.current = true;
    lastPos.current = { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);

    if (toolMode === "highlight") {
      ctx.strokeStyle = "rgba(250, 204, 21, 0.4)"; // translucent yellow
      ctx.lineWidth = 14;
      ctx.lineCap = "square";
    } else {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
    }

    ctx.stroke();
    lastPos.current = { x, y };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const saveEditedPdf = async () => {
    if (!file || !canvasRef.current) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const imgDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const imgRes = await fetch(imgDataUrl);
      const imgBuffer = await imgRes.arrayBuffer();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const embeddedImg = await pdfDoc.embedJpg(imgBuffer);

      const targetPage = pdfDoc.getPage(currentPage - 1);
      const { width, height } = targetPage.getSize();

      // Draw the canvas modifications on top of the target page
      targetPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width,
        height,
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-edited.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save edited PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <Edit3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Edit PDF</h2>
          <p className="text-sm text-slate-500">
            Draw, annotate, highlight and add custom text directly onto your PDF pages.
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Previous Page
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setToolMode("draw")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                toolMode === "draw" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              Pen Draw
            </button>
            <button
              type="button"
              onClick={() => setToolMode("highlight")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                toolMode === "highlight" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Highlighter className="h-3.5 w-3.5" />
              Highlighter
            </button>
            <button
              type="button"
              onClick={() => setToolMode("text")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                toolMode === "text" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Add Text
            </button>

            {toolMode === "draw" && (
              <div className="flex items-center gap-2 pl-3">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-lg border-0"
                />
                <select
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                >
                  <option value={2}>Thin (2px)</option>
                  <option value={4}>Medium (4px)</option>
                  <option value={8}>Thick (8px)</option>
                </select>
              </div>
            )}

            {toolMode === "text" && (
              <div className="flex items-center gap-2 pl-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Click on canvas to place"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => renderPagePreview(file, currentPage)}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <Undo className="h-3.5 w-3.5" />
              Reset annotations
            </button>
          </div>

          <div className="relative mx-auto flex justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-h-[600px] cursor-crosshair rounded-lg bg-white shadow-md"
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveEditedPdf}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
          {processing ? "Saving Edits..." : "Save Edited PDF"}
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
            PDF edited and saved successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Edited PDF
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
