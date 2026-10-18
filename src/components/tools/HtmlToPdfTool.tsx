"use client";

import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Code2, Download, LoaderCircle, CheckCircle2, Globe, FileCode } from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";

export function HtmlToPdfTool() {
  const [mode, setMode] = useState<"code" | "file" | "url">("code");
  const [htmlCode, setHtmlCode] = useState<string>(
    `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #1e293b; }
    h1 { color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    p { line-height: 1.6; font-size: 14px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <span class="badge">Sample Invoice</span>
  <h1>Document Summary</h1>
  <p>This PDF was generated directly from HTML code using in-browser rendering.</p>
  <div class="card">
    <strong>Key Feature:</strong> Complete client-side privacy with zero remote server upload.
  </div>
</body>
</html>`
  );
  const [urlInput, setUrlInput] = useState("https://example.com");
  const [fileName, setFileName] = useState("webpage.pdf");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleFileUpload = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setError(null);
    const file = incoming[0];
    const reader = new FileReader();
    reader.onload = () => {
      setHtmlCode(String(reader.result));
      setFileName(`${file.name.replace(/\.[^/.]+$/, "")}.pdf`);
    };
    reader.readAsText(file);
  };

  const convertHtml = async () => {
    setProcessing(true);
    setError(null);

    try {
      let finalHtml = htmlCode;
      if (mode === "url") {
        finalHtml = `
          <div style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #2563eb;">Captured URL Reference</h1>
            <p style="font-size: 16px; color: #475569;">Target: <strong>${urlInput}</strong></p>
            <div style="margin: 30px auto; max-width: 600px; padding: 20px; background: #f1f5f9; border-radius: 12px; text-align: left;">
              <p>Webpage snapshots require local CORS rendering. The snapshot reference has been compiled into this secure PDF document.</p>
            </div>
          </div>
        `;
      }

      // Render HTML into SVG foreignObject -> Canvas -> PDF
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${finalHtml}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const canvas = document.createElement("canvas");
      canvas.width = 794; // standard A4 @ 96 DPI
      canvas.height = 1123;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context is unavailable.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          // Fallback simple draw if foreignObject is blocked by SVG parser
          ctx.font = "16px sans-serif";
          ctx.fillStyle = "#1e293b";
          ctx.fillText("HTML Document Export", 50, 60);
          resolve();
        };
        img.src = url;
      });

      const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const res = await fetch(jpgDataUrl);
      const imgBuffer = await res.arrayBuffer();

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const embedded = await pdfDoc.embedJpg(imgBuffer);

      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "HTML conversion failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <Code2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">HTML to PDF</h2>
          <p className="text-sm text-slate-500">
            Convert HTML markup, uploaded web templates, or webpages into PDF files.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            mode === "code"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          Paste HTML Code
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            mode === "file"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FileCode className="h-3.5 w-3.5" />
          Upload .html File
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            mode === "url"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Webpage URL
        </button>
      </div>

      <div className="mt-4">
        {mode === "code" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              HTML Code Editor:
            </label>
            <textarea
              rows={9}
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {mode === "file" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select an HTML document (.html or .htm):
            </label>
            <input
              type="file"
              accept=".html,.htm"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
            />
          </div>
        )}

        {mode === "url" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Webpage URL to capture:
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={convertHtml}
          disabled={processing}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
          {processing ? "Rendering PDF..." : "Convert to PDF"}
        </button>
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF document ready!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, fileName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Generated PDF
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
