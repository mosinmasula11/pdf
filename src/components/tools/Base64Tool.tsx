"use client";

import { useState } from "react";
import { Binary, Check, Copy, FileCode, RefreshCw, Upload } from "lucide-react";
import { formatBytes } from "@/lib/browser-utils";

export function Base64Tool() {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [inputVal, setInputVal] = useState("");
  const [outputVal, setOutputVal] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [mimeType, setMimeType] = useState<string>("");

  // UTF-8 safe text encode/decode
  const handleEncodeText = () => {
    setError(null);
    try {
      const encoded = btoa(
        encodeURIComponent(inputVal).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      );
      setOutputVal(encoded);
    } catch {
      setError("Unable to encode text to Base64.");
    }
  };

  const handleDecodeText = () => {
    setError(null);
    try {
      const decoded = decodeURIComponent(
        Array.prototype.map
          .call(atob(inputVal.trim()), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      setOutputVal(decoded);
    } catch {
      setError("Invalid Base64 string. Please verify your input.");
    }
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    setMimeType(file.type || "application/octet-stream");

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setOutputVal(result);
    };
    reader.onerror = () => {
      setError("Failed to read file into Base64.");
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = async () => {
    if (!outputVal) return;
    await navigator.clipboard.writeText(outputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <Binary className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Base64 Encoder & Decoder</h2>
          <p className="text-sm text-slate-500">
            Encode and decode text, or convert images and documents into Base64 Data URLs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("text");
            setOutputVal("");
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "text"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Text Converter
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("file");
            setOutputVal("");
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "file"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Image & File to Base64
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Tab: Text */}
      {activeTab === "text" ? (
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Input Text or Base64</label>
            <textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              rows={5}
              placeholder="Enter plain text to encode, or Base64 string to decode..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-mono text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEncodeText}
              disabled={!inputVal.trim()}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-40"
            >
              Encode to Base64
            </button>
            <button
              type="button"
              onClick={handleDecodeText}
              disabled={!inputVal.trim()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Decode Base64
            </button>
            <button
              type="button"
              onClick={() => {
                setInputVal("");
                setOutputVal("");
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              <RefreshCw className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      ) : (
        /* Tab: File */
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              className="hidden"
              id="base64-file-input"
            />
            <label
              htmlFor="base64-file-input"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Upload className="h-4 w-4" />
              Select image or file
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Converts any image, SVG, PDF or font to a Data URL locally in your browser.
            </p>

            {fileName && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
                <FileCode className="h-4 w-4 text-violet-600" />
                <span className="font-semibold text-slate-900">{fileName}</span>
                {fileSize && <span>({formatBytes(fileSize)})</span>}
                {mimeType && <span className="text-slate-400">[{mimeType}]</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output Area */}
      {outputVal && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Result</label>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Base64!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  Copy Result
                </>
              )}
            </button>
          </div>

          <textarea
            value={outputVal}
            readOnly
            rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-mono text-slate-700 outline-none select-all"
          />

          {activeTab === "file" && outputVal.startsWith("data:image/") && (
            <div className="mt-3 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={outputVal} alt="Preview" className="h-16 w-16 rounded-lg object-contain bg-white border border-slate-200 p-1" />
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-800">HTML & CSS Snippets</p>
                <code className="mt-1 block max-w-md truncate rounded-md bg-white p-1 text-[11px] font-mono text-slate-600 border border-slate-200">
                  {`<img src="${outputVal.substring(0, 50)}..." />`}
                </code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

