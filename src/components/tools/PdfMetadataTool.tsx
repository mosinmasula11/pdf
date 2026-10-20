"use client";

import { useEffect, useRef, useState } from "react";
import { readPdfProperties, writePdfProperties } from "@/lib/pdf-metadata";
import { Download, FileText, LoaderCircle, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function PdfMetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const requestId = useRef(0);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [openedPassword, setOpenedPassword] = useState("");
  const [unlockedConsent, setUnlockedConsent] = useState(false);
  const [wipe, setWipe] = useState(false);
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

  useEffect(() => () => {
    ++requestId.current;
    setFile(null);
    setLoading(false); setReady(false); setProcessing(false);
    setNeedsPassword(false); setPassword(""); setOpenedPassword("");
    setUnlockedConsent(false); setWipe(false);
    setError(null); setResultBlob(null); setDownloadName("updated-metadata.pdf");
    setTitle(""); setAuthor(""); setSubject("");
    setKeywords(""); setCreator(""); setProducer("");
  }, []);

  const handleFile = async (selected: File | null, suppliedPassword = "") => {
    if (!selected) return;
    const id = ++requestId.current;
    setTitle(""); setAuthor(""); setSubject(""); setKeywords(""); setCreator(""); setProducer("");
    setFile(null); setReady(false); setNeedsPassword(false); setPassword(""); setOpenedPassword(""); setUnlockedConsent(false); setProcessing(false);
    setResultBlob(null);
    setError(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF document.");
      return;
    }

    setFile(selected);
    setWipe(false);
    setLoading(true);

    try {
      const buffer = await selected.arrayBuffer();
      const values = await readPdfProperties(buffer, suppliedPassword);
      if (id !== requestId.current) return;
      setTitle(values.title); setAuthor(values.author); setSubject(values.subject); setKeywords(values.keywords); setCreator(values.creator); setProducer(values.producer);
      setOpenedPassword(suppliedPassword); setReady(true);
    } catch (err) {
      if (id !== requestId.current) return;
      const message = err instanceof Error ? err.message : "";
      if (/password|encrypted/i.test(message)) {
        setNeedsPassword(true);
        if (suppliedPassword) setError("The password was not accepted. Please try again.");
      } else setError("Could not read this PDF. Choose a valid PDF before editing metadata.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const handleWipeAll = () => {
    setWipe(true);
    setResultBlob(null);
    setTitle("");
    setAuthor("");
    setSubject("");
    setKeywords("");
    setCreator("");
    setProducer("");
  };

  const saveMetadata = async () => {
    if (!file || !ready || (openedPassword && !unlockedConsent)) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    const id = requestId.current;
    setResultBlob(null);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = await writePdfProperties(buffer, { title, author, subject, keywords, creator, producer }, wipe, openedPassword);
      if (id !== requestId.current) return;
      const outBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

      const blob = new Blob([outBuffer], { type: "application/pdf" });
      setResultBlob(blob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setDownloadName(`${baseName}-clean-meta.pdf`);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "Failed to update PDF metadata.");
    } finally {
      if (id === requestId.current) setProcessing(false);
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
            Edit or remove document properties and XMP metadata. Comments, attachments, and document content are unchanged.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => { const selected = e.target.files?.[0] || null; e.target.value = ""; void handleFile(selected); }}
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

      {loading && <p role="status" className="mt-4 text-sm text-slate-600">Reading PDF metadata...</p>}
      {needsPassword && file && <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void handleFile(file, password); }}>
        <label className="text-sm font-medium">PDF password<input type="password" autoComplete="off" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1 block rounded-md border border-slate-300 px-3 py-2" /></label>
        <button type="submit" className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Unlock metadata</button>
        <p className="w-full text-xs text-slate-600">The password is used in this browser only and is not stored.</p>
      </form>}
      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && ready && (
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <p className="text-xs text-amber-800">Editing metadata changes the PDF and can invalidate digital signatures. The original file is unchanged.</p>
          {openedPassword && <label className="flex items-start gap-2 text-sm text-amber-900"><input type="checkbox" checked={unlockedConsent} onChange={event => setUnlockedConsent(event.target.checked)} className="mt-1"/>Download an unencrypted edited copy. The original password protection will not be retained.</label>}
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

          <fieldset disabled={processing} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Document Title</label>
              <input
                type="text"
                value={title}
                aria-label="Document Title"
                onChange={(e) => { setTitle(e.target.value); setWipe(false); setResultBlob(null); }}
                placeholder="e.g. Annual Financial Report"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Author</label>
              <input
                type="text"
                value={author}
                aria-label="Author"
                onChange={(e) => { setAuthor(e.target.value); setWipe(false); setResultBlob(null); }}
                placeholder="e.g. John Doe / Company Name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                value={subject}
                aria-label="Subject"
                onChange={(e) => { setSubject(e.target.value); setWipe(false); setResultBlob(null); }}
                placeholder="e.g. Q4 Performance & Audits"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Keywords (comma separated)</label>
              <input
                type="text"
                value={keywords}
                aria-label="Keywords"
                onChange={(e) => { setKeywords(e.target.value); setWipe(false); setResultBlob(null); }}
                placeholder="e.g. finance, audit, 2026, report"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Creator Application</label>
              <input
                type="text"
                value={creator}
                aria-label="Creator Application"
                onChange={(e) => { setCreator(e.target.value); setWipe(false); setResultBlob(null); }}
                placeholder="e.g. MSYN Tools / Word"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Producer</label>
              <input
                type="text"
                value={producer}
                aria-label="Producer"
                onChange={(e) => { setProducer(e.target.value); setWipe(false); setResultBlob(null); }}
                placeholder="e.g. PDF Engine"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
              />
            </div>
          </fieldset>

          <div className="mt-4 flex justify-end pt-2">
            <button
              type="button"
              onClick={saveMetadata}
              disabled={processing || Boolean(openedPassword && !unlockedConsent)}
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

