"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileText, LoaderCircle, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function PdfMetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState<string>("updated-metadata.pdf");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [creator, setCreator] = useState("");
  const [producer, setProducer] = useState("");

  const handleFile = async (selected: File | null) => {
    if (!selected) return;
    setResultBlob(null);
    setError(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF document.");
      return;
    }

    setFile(selected);

    try {
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      setTitle(pdfDoc.getTitle() || "");
      setAuthor(pdfDoc.getAuthor() || "");
      setSubject(pdfDoc.getSubject() || "");
      setKeywords(pdfDoc.getKeywords() || "");
      setCreator(pdfDoc.getCreator() || "");
      setProducer(pdfDoc.getProducer() || "");
    } catch {
      setError("Could not parse existing PDF metadata. You can still enter new metadata.");
    }
  };

  const handleWipeAll = () => {
    setTitle("");
    setAuthor("");
    setSubject("");
    setKeywords("");
    setCreator("");
    setProducer("");
  };

  const saveMetadata = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      pdfDoc.setTitle(title.trim());
      pdfDoc.setAuthor(author.trim());
      pdfDoc.setSubject(subject.trim());
      pdfDoc.setKeywords(keywords.split(",").map((k) => k.trim()).filter(Boolean));
      pdfDoc.setCreator(creator.trim());
      pdfDoc.setProducer(producer.trim());
      pdfDoc.setModificationDate(new Date());

      const bytes = await pdfDoc.save();
      const outBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

      const blob = new Blob([outBuffer], { type: "application/pdf" });
      setResultBlob(blob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setDownloadName(`${baseName}-clean-meta.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update PDF metadata.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">PDF Metadata Editor & Stripper</h2>
          <p className="text-sm text-slate-500">
            View, edit or completely remove hidden author, title, and software tags for privacy.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="hidden"
          id="pdf-metadata-file-input"
        />
        <label
          htmlFor="pdf-metadata-file-input"
          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          {file ? "Choose another PDF" : "Choose PDF file"}
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Client-side document inspection. Your file never touches external servers.
        </p>

        {file && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 shadow-xs">
            <span className="font-semibold text-slate-900">{file.name}</span>
            <span>•</span>
            <span>{formatBytes(file.size)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && (
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Document Properties</h3>
            <button
              type="button"
              onClick={handleWipeAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wipe all metadata (Privacy mode)
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Financial Report"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. John Doe / Company Name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Q4 Performance & Audits"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Keywords (comma separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. finance, audit, 2026, report"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Creator Application</label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="e.g. MSYN Tools / Word"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Producer</label>
              <input
                type="text"
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                placeholder="e.g. PDF Engine"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end pt-2">
            <button
              type="button"
              onClick={saveMetadata}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving metadata...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Apply & Save Metadata
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {resultBlob && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center sm:text-left">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="font-bold text-emerald-900">PDF metadata updated successfully!</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                New sanitized metadata has been saved into your document ({formatBytes(resultBlob.size)}).
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Clean PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

