"use client";

import { useMemo, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";

export function WordCounterTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const paragraphs = text.trim() ? text.split(/\n+/).filter((part) => part.trim()).length : 0;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(Boolean).length : 0;

    return { words, characters, charactersNoSpaces, paragraphs, sentences };
  }, [text]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-100 p-2 text-sky-600"><FileText className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Word Counter</h2>
          <p className="text-sm text-slate-500">Count words, characters and reading structure instantly.</p>
        </div>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Paste or type your text here..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none ring-0 focus:border-violet-300" />

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={() => setText("")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <RefreshCw className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Words", value: stats.words },
          { label: "Characters", value: stats.characters },
          { label: "No spaces", value: stats.charactersNoSpaces },
          { label: "Paragraphs", value: stats.paragraphs },
          { label: "Sentences", value: stats.sentences },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-bold text-slate-900">{item.value}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
