"use client";

import { useState } from "react";
import { Languages, Download, LoaderCircle, Copy, Check } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { translationChunks } from "@/lib/translation-chunks";
import { extractTextFromPdf } from "@/lib/pdfjs-helper";

const LANGUAGES = [
  { code: "en", name: "English" },
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
  const [sourceLang, setSourceLang] = useState("en");
  const [consent, setConsent] = useState(false);
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
    setConsent(false);
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

    if (!consent) { setError("Allow MyMemory to receive the extracted text before translating."); return; }
    if (sourceLang === targetLang) { setError("Choose different source and target languages."); return; }
    setTranslatedText("");
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

      // Stay below the service byte limit without silently dropping any text.
      const chunks = translationChunks(text);
      const translatedParagraphs: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setProgress(`Translating section ${i + 1} of ${chunks.length}...`);
        const query = new URLSearchParams({ q: chunks[i], langpair: `${sourceLang}|${targetLang}` });
        const response = await fetch(`https://api.mymemory.translated.net/get?${query}`, { signal: AbortSignal.timeout(20000), credentials: "omit", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error("Translation service is unavailable. Please try again later.");
        const data = await response.json();
        if (Number(data.responseStatus) !== 200 || !data.responseData?.translatedText) {
          throw new Error(data.responseDetails || "Translation failed. No translated output was created.");
        }
        translatedParagraphs.push(data.responseData.translatedText);
      }

      const finalTranslation = translatedParagraphs.join("");
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
            Translate extracted text using MyMemory, an external translation service. Your PDF stays here; its extracted text is sent only after you opt in.
          </p>
        </div>
      </div>

      <input
        disabled={processing}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-5 space-y-4">
          <label className="block text-sm text-slate-700">Source language
            <select aria-label="Source language" value={sourceLang} disabled={processing} onChange={(e) => { setSourceLang(e.target.value); setTranslatedText(""); }} className="ml-3 rounded-xl border p-2">
              <option value="en">English</option>
              {LANGUAGES.filter((language) => language.code !== "en").map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}
            </select>
          </label>
          <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <input type="checkbox" checked={consent} disabled={processing} onChange={(e) => setConsent(e.target.checked)} />
            Allow MyMemory to receive all extracted document text for translation. Its privacy policy applies. Do not use this option for confidential documents.
          </label>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Select target language:
            </label>
            <select
              value={targetLang}
              disabled={processing}
              onChange={(e) => { setTargetLang(e.target.value); setTranslatedText(""); }}
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
          disabled={processing || !file || !consent}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          {processing ? progress || "Translating..." : "Translate PDF"}
        </button>

        {file && (
          <button
            type="button"
            disabled={processing}
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
                Original Text ({sourceLang.toUpperCase()})
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
