"use client";

import { useState } from "react";
import { FileCode, Download, LoaderCircle, Copy, Check, Eye, Code } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { getPdfJs } from "@/lib/pdfjs-helper";

export function PdfToMarkdownTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("code");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setMarkdown("");
    setError(null);
  };

  const convertToMarkdown = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let md = `# ${file.name.replace(/\.pdf$/i, "")}\n\n`;

      for (let p = 1; p <= totalPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();

        // Calculate average font height to detect headings
        const heights: number[] = [];
        textContent.items.forEach((item: any) => {
          if ("height" in item && item.height > 0) heights.push(item.height);
        });
        const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : 12;

        let lastY: number | null = null;
        let lineBuffer = "";

        for (const item of textContent.items as any[]) {
          if (!("str" in item)) continue;
          const str = item.str;
          const y = item.transform ? Math.round(item.transform[5]) : 0;
          const height = item.height || avgHeight;

          if (lastY !== null && Math.abs(lastY - y) > 5) {
            // New line
            const trimmed = lineBuffer.trim();
            if (trimmed) {
              if (height > avgHeight * 1.5) {
                md += `\n## ${trimmed}\n\n`;
              } else if (height > avgHeight * 1.25) {
                md += `\n### ${trimmed}\n\n`;
              } else if (/^[•\-\*]\s*/.test(trimmed)) {
                md += `- ${trimmed.replace(/^[•\-\*]\s*/, "")}\n`;
              } else if (/^\d+[\.\)]\s*/.test(trimmed)) {
                md += `${trimmed}\n`;
              } else {
                md += `${trimmed}\n\n`;
              }
            }
            lineBuffer = str;
          } else {
            lineBuffer += (lineBuffer && !lineBuffer.endsWith(" ") ? " " : "") + str;
          }
          lastY = y;
        }

        if (lineBuffer.trim()) {
          md += `${lineBuffer.trim()}\n\n`;
        }

        if (p < totalPages) {
          md += `\n---\n\n`;
        }
      }

      setMarkdown(md.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF to Markdown conversion failed.");
    } finally {
      setProcessing(false);
    }
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!file || !markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}.md`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600">
          <FileCode className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">PDF to Markdown</h2>
          <p className="text-sm text-slate-500">
            Convert structured PDF documents into clean, GitHub-flavored Markdown.
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
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={convertToMarkdown}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileCode className="h-4 w-4" />}
          {processing ? "Extracting Markdown..." : "Convert to Markdown"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setMarkdown("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {markdown && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "code"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                Raw Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "preview"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Rendered Preview
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyMarkdown}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Markdown"}
              </button>
              <button
                type="button"
                onClick={downloadMarkdown}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download .md File
              </button>
            </div>
          </div>

          {activeTab === "code" ? (
            <textarea
              readOnly
              rows={16}
              value={markdown}
              className="w-full rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 outline-none"
            />
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-800 space-y-3 prose prose-slate">
              {markdown.split("\n\n").map((para, i) => {
                if (para.startsWith("# ")) {
                  return <h1 key={i} className="text-2xl font-black text-slate-900">{para.replace(/^# /, "")}</h1>;
                }
                if (para.startsWith("## ")) {
                  return <h2 key={i} className="text-xl font-bold text-slate-900">{para.replace(/^## /, "")}</h2>;
                }
                if (para.startsWith("### ")) {
                  return <h3 key={i} className="text-base font-semibold text-slate-800">{para.replace(/^### /, "")}</h3>;
                }
                if (para === "---") {
                  return <hr key={i} className="border-slate-200 my-4" />;
                }
                return <p key={i} className="leading-relaxed text-slate-700">{para}</p>;
              })}
            </div>
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

