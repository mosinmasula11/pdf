"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ScanText, Download, LoaderCircle, Copy, Check, Search, FileText } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { extractTextFromPdf } from "@/lib/pdfjs-helper";

export function OcrPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    fullText: string;
    pagesText: string[];
    pageCount: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setExtractedData(null);
    setError(null);
  };

  const runOcr = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await extractTextFromPdf(arrayBuffer);
      if (!result.fullText.trim()) {
        setError(
          "No selectable text could be extracted. The PDF may consist solely of raster scans without OCR text layers."
        );
      }
      setExtractedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR text extraction failed.");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedData) return;
    await navigator.clipboard.writeText(extractedData.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!file || !extractedData) return;
    const blob = new Blob([extractedData.fullText], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}-ocr-text.txt`);
  };

  const downloadSearchablePdf = async () => {
    if (!file || !extractedData) return;
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < extractedData.pagesText.length; i++) {
        const text = extractedData.pagesText[i];
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { height } = page.getSize();

        // Simple text layout with word wrapping
        const lines = text.match(/.{1,75}(\s|$)/g) || [text];
        let currentY = height - 50;

        for (const line of lines) {
          if (currentY < 40) break;
          page.drawText(line.trim(), {
            x: 50,
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 14;
        }
      }

      const bytes = await pdfDoc.save();
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}-searchable.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create searchable PDF.");
    }
  };

  const filteredPages = extractedData
    ? extractedData.pagesText.map((t, idx) => ({ page: idx + 1, text: t }))
    : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-100 p-2 text-cyan-600">
          <ScanText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">OCR PDF</h2>
          <p className="text-sm text-slate-500">
            Extract text from your PDF document and make it fully searchable and copyable.
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
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runOcr}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
          {processing ? "Recognizing Text..." : "Recognize & Extract Text"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setExtractedData(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {extractedData && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="text-sm font-semibold text-slate-900">
              Extracted {extractedData.fullText.split(/\s+/).filter(Boolean).length} words across {extractedData.pageCount} pages
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button
                type="button"
                onClick={downloadTxt}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                <FileText className="h-3.5 w-3.5" />
                Download TXT
              </button>
              <button
                type="button"
                onClick={downloadSearchablePdf}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
              >
                <Download className="h-3.5 w-3.5" />
                Searchable PDF
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search extracted text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            {filteredPages.map(({ page, text }) => {
              if (searchQuery && !text.toLowerCase().includes(searchQuery.toLowerCase())) {
                return null;
              }
              return (
                <div key={page} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
                    Page {page}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {text || <span className="italic text-slate-400">(No text detected on this page)</span>}
                  </p>
                </div>
              );
            })}
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

