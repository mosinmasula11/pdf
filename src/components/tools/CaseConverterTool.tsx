"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, RefreshCw, Type } from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";

export function CaseConverterTool() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  // Conversion helpers
  const toSentenceCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  };

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  };

  const toCamelCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, (c) => c.toLowerCase());
  };

  const toPascalCase = (str: string) => {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  };

  const toSnakeCase = (str: string) => {
    return str
      .trim()
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s\W-]+/g, "_")
      .toLowerCase();
  };

  const toKebabCase = (str: string) => {
    return str
      .trim()
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s\W_]+/g, "-")
      .toLowerCase();
  };

  const toConstantCase = (str: string) => {
    return toSnakeCase(str).toUpperCase();
  };

  const toDotCase = (str: string) => {
    return str
      .trim()
      .replace(/([a-z])([A-Z])/g, "$1.$2")
      .replace(/[\s\W_-]+/g, ".")
      .toLowerCase();
  };

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `converted-text-${Date.now()}.txt`);
  };

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const lines = text ? text.split("\n").length : 0;
    return { words, characters, lines };
  }, [text]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <Type className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Text Case Converter</h2>
          <p className="text-sm text-slate-500">
            Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, and more.
          </p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          placeholder="Paste or type your text here to transform its case format..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none ring-0 focus:border-violet-400 focus:bg-white"
        />
        {text && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Case Options */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "Sentence case", action: () => setText((prev) => toSentenceCase(prev)) },
          { label: "lower case", action: () => setText((prev) => prev.toLowerCase()) },
          { label: "UPPER CASE", action: () => setText((prev) => prev.toUpperCase()) },
          { label: "Title Case", action: () => setText((prev) => toTitleCase(prev)) },
          { label: "camelCase", action: () => setText((prev) => toCamelCase(prev)) },
          { label: "PascalCase", action: () => setText((prev) => toPascalCase(prev)) },
          { label: "snake_case", action: () => setText((prev) => toSnakeCase(prev)) },
          { label: "kebab-case", action: () => setText((prev) => toKebabCase(prev)) },
          { label: "CONSTANT_CASE", action: () => setText((prev) => toConstantCase(prev)) },
          { label: "dot.case", action: () => setText((prev) => toDotCase(prev)) },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            disabled={!text.trim()}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <span>Words: <strong className="text-slate-800">{stats.words}</strong></span>
          <span>Characters: <strong className="text-slate-800">{stats.characters}</strong></span>
          <span>Lines: <strong className="text-slate-800">{stats.lines}</strong></span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setText("")}
            disabled={!text}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!text}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Download .txt
          </button>
        </div>
      </div>
    </div>
  );
}

