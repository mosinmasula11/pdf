"use client";

import { useState } from "react";
import { GitCompare, Download, LoaderCircle, CheckCircle2, FileText, ArrowRight, Plus, Minus } from "lucide-react";
import { formatBytes } from "@/lib/browser-utils";
import { extractTextFromPdf } from "@/lib/pdfjs-helper";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export function ComparePdfTool() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [diffResults, setDiffResults] = useState<{
    pageCountA: number;
    pageCountB: number;
    diffLines: DiffLine[];
    additions: number;
    deletions: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileA = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setDiffResults(null);
    setFileA(incoming[0]);
    setDiffResults(null);
    setError(null);
  };

  const handleFileB = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setDiffResults(null);
    setFileB(incoming[0]);
    setDiffResults(null);
    setError(null);
  };

  const comparePdfs = async () => {
    if (!fileA || !fileB) {
      setError("Please select both PDF documents to compare.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      const [extractedA, extractedB] = await Promise.all([
        extractTextFromPdf(bufA),
        extractTextFromPdf(bufB),
      ]);

      const linesA = extractedA.fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const linesB = extractedB.fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      const setA = new Set(linesA);
      const setB = new Set(linesB);

      const diffs: DiffLine[] = [];
      let adds = 0;
      let dels = 0;

      // Simple line diff algorithm
      const maxLen = Math.max(linesA.length, linesB.length);
      const visitedB = new Set<number>();

      for (let i = 0; i < linesA.length; i++) {
        const lineA = linesA[i];
        if (!setB.has(lineA)) {
          diffs.push({ type: "removed", text: lineA });
          dels++;
        } else {
          // Find matching line in B
          const bIdx = linesB.findIndex((lb, idx) => lb === lineA && !visitedB.has(idx));
          if (bIdx !== -1) {
            visitedB.add(bIdx);
            diffs.push({ type: "unchanged", text: lineA });
          }
        }
      }

      for (let j = 0; j < linesB.length; j++) {
        if (!visitedB.has(j)) {
          diffs.push({ type: "added", text: linesB[j] });
          adds++;
        }
      }

      setDiffResults({
        pageCountA: extractedA.pageCount,
        pageCountB: extractedB.pageCount,
        diffLines: diffs,
        additions: adds,
        deletions: dels,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF comparison failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <GitCompare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Compare PDF Files</h2>
          <p className="text-sm text-slate-500">
            Compare two PDF document versions side by side and highlight differences.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Document 1 (Original Version)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileA(e.target.files)}
            className="block w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-700"
          />
          {fileA && (
            <div className="mt-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{fileA.name}</span> • {formatBytes(fileA.size)}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Document 2 (Modified Version)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileB(e.target.files)}
            className="block w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-700"
          />
          {fileB && (
            <div className="mt-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{fileB.name}</span> • {formatBytes(fileB.size)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={comparePdfs}
          disabled={processing || !fileA || !fileB}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
          {processing ? "Comparing Documents..." : "Compare PDF Documents"}
        </button>

        {(fileA || fileB) && (
          <button
            type="button"
            onClick={() => {
              setFileA(null);
              setFileB(null);
              setDiffResults(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {diffResults && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              Comparison Summary:
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-600">
                <Plus className="h-3.5 w-3.5" />
                {diffResults.additions} added
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <Minus className="h-3.5 w-3.5" />
                {diffResults.deletions} removed
              </span>
              <span className="text-slate-500">
                Doc A ({diffResults.pageCountA} pages) vs Doc B ({diffResults.pageCountB} pages)
              </span>
            </div>
          </div>

          <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs">
            {diffResults.diffLines.slice(0, 100).map((line, idx) => {
              if (line.type === "added") {
                return (
                  <div key={idx} className="flex gap-2 rounded bg-emerald-950/60 text-emerald-400 px-2 py-0.5">
                    <span className="text-emerald-500 select-none">+</span>
                    <span>{line.text}</span>
                  </div>
                );
              }
              if (line.type === "removed") {
                return (
                  <div key={idx} className="flex gap-2 rounded bg-rose-950/60 text-rose-400 px-2 py-0.5">
                    <span className="text-rose-500 select-none">-</span>
                    <span>{line.text}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex gap-2 text-slate-400 px-2 py-0.5">
                  <span className="text-slate-600 select-none"> </span>
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>
          {diffResults.diffLines.length > 100 && (
            <p className="text-xs text-slate-400">
              Showing first 100 diff lines.
            </p>
          )}
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
