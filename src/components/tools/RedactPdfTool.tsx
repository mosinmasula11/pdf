"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { EyeOff, Download, LoaderCircle, CheckCircle2, Trash2, Undo } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { getPdfJs } from "@/lib/pdfjs-helper";

interface RedactionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export function RedactPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("redacted.pdf");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const currentDrag = useRef<{ x: number; y: number } | null>(null);
  const pageScaleRef = useRef<number>(1.2);

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
      setRedactions([]);
      setResultBlob(null);
      setError(null);
      renderPage(selected, 1, []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF.");
    }
  };

  const renderPage = async (pdfFile: File, pageNum: number, currentRedactions: RedactionBox[]) => {
    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);
      const scale = pageScaleRef.current;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      // Draw existing redactions on this page
      const pageBoxes = currentRedactions.filter((b) => b.page === pageNum);
      ctx.fillStyle = "#000000";
      for (const b of pageBoxes) {
        ctx.fillRect(b.x * scale, b.y * scale, b.width * scale, b.height * scale);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (file) {
      renderPage(file, currentPage, redactions);
    }
  }, [currentPage, redactions]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isDragging.current = true;
    startPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    currentDrag.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    currentDrag.current = { x: curX, y: curY };

    // Redraw page and current marquee
    if (file) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // draw current drag rectangle preview
      const x = Math.min(startPos.current.x, curX);
      const y = Math.min(startPos.current.y, curY);
      const w = Math.abs(curX - startPos.current.x);
      const h = Math.abs(curY - startPos.current.y);

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(x, y, w, h);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const scale = pageScaleRef.current;
    const rawX = Math.min(startPos.current.x, curX) / scale;
    const rawY = Math.min(startPos.current.y, curY) / scale;
    const rawW = Math.abs(curX - startPos.current.x) / scale;
    const rawH = Math.abs(curY - startPos.current.y) / scale;

    isDragging.current = false;
    startPos.current = null;
    currentDrag.current = null;

    if (rawW > 5 && rawH > 5) {
      setRedactions((prev) => [
        ...prev,
        {
          id: `box-${Date.now()}-${Math.random()}`,
          x: rawX,
          y: rawY,
          width: rawW,
          height: rawH,
          page: currentPage,
        },
      ]);
    }
  };

  const removeRedaction = (id: string) => {
    setRedactions((prev) => prev.filter((b) => b.id !== id));
  };

  const applyRedactions = async () => {
    if (!file || redactions.length === 0) {
      setError("Please draw at least one blackout redaction box on the document.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      for (const box of redactions) {
        const page = pdfDoc.getPage(box.page - 1);
        const { height } = page.getSize();

        // Convert canvas top-left coordinates to PDF bottom-left coordinates
        const pdfY = height - box.y - box.height;

        page.drawRectangle({
          x: box.x,
          y: pdfY,
          width: box.width,
          height: box.height,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-redacted.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply redactions.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-900">
          <EyeOff className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Redact PDF</h2>
          <p className="text-sm text-slate-500">
            Permanently blackout sensitive text, personal data, and confidential information.
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
              Page {currentPage} of {totalPages} • {redactions.length} redaction(s) marked
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

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <strong>How to redact:</strong> Click and drag a black rectangle box over any sensitive text or area you want to permanently erase.
          </div>

          <div className="relative mx-auto flex justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-h-[600px] cursor-crosshair rounded-lg bg-white shadow-md select-none"
            />
          </div>

          {redactions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
              <span className="text-slate-500 font-medium">
                {redactions.filter((b) => b.page === currentPage).length} redaction(s) on this page
              </span>
              <button
                type="button"
                onClick={() => setRedactions([])}
                className="flex items-center gap-1 text-rose-600 font-semibold hover:underline"
              >
                <Trash2 className="h-3 w-3" />
                Clear all redactions
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={applyRedactions}
          disabled={processing || !file || redactions.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
          {processing ? "Applying Redactions..." : `Permanently Redact PDF (${redactions.length})`}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setRedactions([]);
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
            PDF permanently redacted! Sensitive data has been blacked out.
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Redacted PDF
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
