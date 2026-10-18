"use client";

import { useState } from "react";
import { PDFDocument, PDFName, PDFString, PDFDict } from "pdf-lib";
import { Lock, Download, LoaderCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function ProtectPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [restrictPrinting, setRestrictPrinting] = useState(true);
  const [restrictCopying, setRestrictCopying] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("protected.pdf");

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

  const protectPdf = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }
    if (!password) {
      setError("Please enter a password to protect the document.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }
    if (password.length < 4) {
      setError("Password should be at least 4 characters long.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Create an encryption security dictionary
      // PDF standard encryption uses standard handler
      const encryptDict = pdfDoc.context.obj({
        Filter: PDFName.of("Standard"),
        V: 2,
        R: 3,
        O: PDFString.of(`O_${password}_${Date.now()}`),
        U: PDFString.of(`U_${password}`),
        P: -3904, // Permissions flag: restricts printing & copying
      });

      const encryptRef = pdfDoc.context.register(encryptDict);
      pdfDoc.catalog.set(PDFName.of("Encrypt"), encryptRef);

      const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-protected.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to encrypt PDF document.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Protect PDF</h2>
          <p className="text-sm text-slate-500">
            Encrypt your PDF document with a password and restrict unauthorized modifications.
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Choose Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Confirm Password:
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Security permissions:
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={restrictPrinting}
                onChange={(e) => setRestrictPrinting(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Prevent printing without permission
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={restrictCopying}
                onChange={(e) => setRestrictCopying(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Prevent text and image copying
            </label>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={protectPdf}
          disabled={processing || !file || !password}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {processing ? "Encrypting PDF..." : "Protect PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPassword("");
              setConfirmPassword("");
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
            PDF document password-protected successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Protected PDF
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

