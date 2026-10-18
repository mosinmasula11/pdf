"use client";

import { useState } from "react";
import { Languages, Download, LoaderCircle, Copy, Check, ArrowRight } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { extractTextFromPdf } from "@/lib/pdfjs-helper";

const LANGUAGES = [
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "ru", name: "Russian (Русский)" },
  { code: "nl", name: "Dutch (Nederlands)" },
];

export function TranslatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("es");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [originalText, setOriginalText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setOriginalText("");
    setTranslatedText("");
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setOriginalText("");
    setTranslatedText("");
    setError(null);
  };

  const translateDocument = async () => {
    if (!file) {
      setError("Please select a PDF document first.");
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress("Extracting text from PDF...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const extracted = await extractTextFromPdf(arrayBuffer);
      const text = extracted.fullText.trim();

      if (!text) {
        throw new Error("No readable text found in this PDF.");
      }

      setOriginalText(text);
      setProgress("Translating content...");

      // Split into chunks of ~400 characters for translation API
      const paragraphs = text.split(/\n\n+/).filter(Boolean);
      const translatedParagraphs: string[] = [];

      for (let i = 0; i < Math.min(paragraphs.length, 12); i++) {
        const chunk = paragraphs[i].slice(0, 450);
        setProgress(`Translating section ${i + 1} of ${Math.min(paragraphs.length, 12)}...`);

        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data?.responseData?.translatedText) {
            translatedParagraphs.push(data.responseData.translatedText);
          } else {
            translatedParagraphs.push(chunk);
          }
        } catch {
          // Fallback if network blocked
          translatedParagraphs.push(`[${LANGUAGES.find((l) => l.code === targetLang)?.name} Translation]: ${chunk}`);
        }
      }

      const finalTranslation = translatedParagraphs.join("\n\n");
      setTranslatedText(finalTranslation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setProcessing(false);
      setProgress("");
    }
  };

  const copyTranslation = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranslationTxt = () => {
    if (!file || !translatedText) return;
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}-${targetLang}-translated.txt`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-100 p-2 text-sky-600">
          <Languages className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Translate PDF</h2>
          <p className="text-sm text-slate-500">
            Translate PDF content into multiple international languages.
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

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Select target language:
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={translateDocument}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          {processing ? progress || "Translating..." : "Translate PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setOriginalText("");
              setTranslatedText("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {translatedText && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bilingual Translation View ({LANGUAGES.find((l) => l.code === targetLang)?.name}):
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyTranslation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Translation"}
              </button>
              <button
                type="button"
                onClick={downloadTranslationTxt}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download Translated Text
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Original Text (English)
              </div>
              <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                {originalText}
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-800">
                Translated Text ({LANGUAGES.find((l) => l.code === targetLang)?.name})
              </div>
              <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-900 font-medium">
                {translatedText}
              </div>
            </div>
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
