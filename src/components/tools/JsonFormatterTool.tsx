"use client";

import { useState } from "react";
import { Braces, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

export function JsonFormatterTool() {
  const [value, setValue] = useState('{"name":"MSYN Tools","tools":["PDF","Image"]}');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formatted, setFormatted] = useState<string>("");

  const formatJson = () => {
    setProcessing(true);
    setError(null);
    try {
      const parsed = JSON.parse(value);
      setFormatted(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON input.");
      setFormatted("");
    } finally {
      setProcessing(false);
    }
  };

  const minifyJson = () => {
    setProcessing(true);
    setError(null);
    try {
      const parsed = JSON.parse(value);
      setFormatted(JSON.stringify(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON input.");
      setFormatted("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-600"><Braces className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">JSON Formatter</h2>
          <p className="text-sm text-slate-500">Validate, format and minify JSON directly in your browser.</p>
        </div>
      </div>

      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={10} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800" />

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={formatJson} disabled={processing} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-violet-300">
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Format JSON
        </button>
        <button type="button" onClick={minifyJson} disabled={processing} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700">
          Minify JSON
        </button>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {!error && formatted && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> JSON valid</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">{formatted}</pre>
        </div>
      )}
    </div>
  );
}
