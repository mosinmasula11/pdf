"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  Download,
  Sparkles,
  FileCode,
  Braces,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  generateTypeScript,
  generateZod,
  generatePydantic,
  generateGo,
  type GenerationTarget,
} from "@/lib/json-type-generator";
import { downloadBlob } from "@/lib/browser-utils";

const SAMPLE_JSONS: Record<string, string> = {
  user: JSON.stringify(
    {
      id: 1042,
      username: "alex_dev",
      email: "alex@example.com",
      is_active: true,
      profile: {
        full_name: "Alex Johnson",
        avatar_url: "https://example.com/avatar.png",
        bio: "Full-stack engineer building AI tools.",
        website: "https://msyn.in",
      },
      roles: ["admin", "developer"],
      preferences: {
        theme: "dark",
        email_notifications: true,
        notification_frequency_hours: 24,
      },
      created_at: "2026-05-12T08:30:00Z",
    },
    null,
    2
  ),
  order: JSON.stringify(
    {
      order_id: "ORD-99824",
      customer: {
        id: 501,
        name: "Samantha Reed",
        is_vip: true,
      },
      items: [
        { sku: "ITEM-A1", title: "Wireless Mechanical Keyboard", quantity: 1, unit_price: 149.99 },
        { sku: "ITEM-B2", title: "Ergonomic Desk Mat", quantity: 2, unit_price: 24.5 },
      ],
      shipping_address: {
        street: "742 Evergreen Terrace",
        city: "Springfield",
        state: "OR",
        zip: "97477",
        country: "USA",
      },
      subtotal: 198.99,
      tax: 15.92,
      total_amount: 214.91,
      payment_status: "paid",
    },
    null,
    2
  ),
  api: JSON.stringify(
    {
      status: "success",
      code: 200,
      data: {
        pagination: {
          current_page: 1,
          per_page: 25,
          total_pages: 8,
          total_items: 192,
        },
        records: [
          { id: "rec_1", title: "Quarterly Financial Overview", tags: ["finance", "q3"], score: 98.4 },
          { id: "rec_2", title: "Product Roadmap Update", tags: ["roadmap", "product"], score: 94.1 },
        ],
      },
    },
    null,
    2
  ),
};

export function JsonToTypesTool() {
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSONS.user);
  const [rootName, setRootName] = useState<string>("Root");
  const [target, setTarget] = useState<GenerationTarget>("typescript");

  // Options
  const [useTypeAlias, setUseTypeAlias] = useState<boolean>(false);
  const [exportPrefix, setExportPrefix] = useState<boolean>(true);
  const [optionalFields, setOptionalFields] = useState<boolean>(false);
  const [readonlyFields, setReadonlyFields] = useState<boolean>(false);

  // Output
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Live generation whenever input or settings change
  useEffect(() => {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      setGeneratedCode("");
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      setError(null);

      const opts = {
        rootName: rootName.trim() || "Root",
        target,
        useTypeAlias,
        exportPrefix,
        optionalFields,
        readonlyFields,
      };

      let code = "";
      switch (target) {
        case "typescript":
          code = generateTypeScript(parsed, opts);
          break;
        case "zod":
          code = generateZod(parsed, opts);
          break;
        case "pydantic":
          code = generatePydantic(parsed, opts);
          break;
        case "go":
          code = generateGo(parsed, opts);
          break;
      }

      setGeneratedCode(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON syntax");
      setGeneratedCode("");
    }
  }, [jsonInput, rootName, target, useTypeAlias, exportPrefix, optionalFields, readonlyFields]);

  const copyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!generatedCode) return;
    const extMap: Record<GenerationTarget, { ext: string; mime: string }> = {
      typescript: { ext: "ts", mime: "text/typescript" },
      zod: { ext: "ts", mime: "text/typescript" },
      pydantic: { ext: "py", mime: "text/x-python" },
      go: { ext: "go", mime: "text/x-go" },
    };
    const { ext, mime } = extMap[target];
    const blob = new Blob([generatedCode], { type: mime });
    downloadBlob(blob, `${(rootName.trim() || "types").toLowerCase()}.${ext}`);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON syntax");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON syntax");
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Format Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "typescript", label: "TypeScript", desc: "interface / type" },
              { id: "zod", label: "Zod Schema", desc: "z.object & z.infer" },
              { id: "pydantic", label: "Python Pydantic", desc: "BaseModel" },
              { id: "go", label: "Go Struct", desc: "type struct" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTarget(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                target === t.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] font-normal ${
                  target === t.id ? "text-violet-200" : "text-slate-400"
                }`}
              >
                ({t.desc})
              </span>
            </button>
          ))}
        </div>

        {/* Root Type Name */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Root Type:</label>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            className="w-36 rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Dual-Pane Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: JSON Input */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Braces className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">JSON Input</h3>
              </div>

              {/* Sample Selector & Quick Actions */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium text-[11px]">Samples:</span>
                <button
                  type="button"
                  onClick={() => setJsonInput(SAMPLE_JSONS.user)}
                  className="rounded px-2 py-0.5 text-violet-600 hover:bg-violet-50 font-medium"
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setJsonInput(SAMPLE_JSONS.order)}
                  className="rounded px-2 py-0.5 text-violet-600 hover:bg-violet-50 font-medium"
                >
                  Order
                </button>
                <button
                  type="button"
                  onClick={() => setJsonInput(SAMPLE_JSONS.api)}
                  className="rounded px-2 py-0.5 text-violet-600 hover:bg-violet-50 font-medium"
                >
                  API
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setJsonInput("")}
                  className="rounded p-1 text-slate-400 hover:text-red-600"
                  title="Clear JSON"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={18}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON payload here..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-800 shadow-inner focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="truncate">{error}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Valid JSON</span>
                </div>
                <span>{jsonInput.length} characters</span>
              </div>
            )}
          </div>

          {/* Format / Minify Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={formatJson}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Prettify JSON
            </button>
            <button
              type="button"
              onClick={minifyJson}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Minify JSON
            </button>
          </div>
        </div>

        {/* Right Pane: Generated Types / Schema */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Generated {target === "typescript" ? "TypeScript" : target === "zod" ? "Zod Schema" : target === "pydantic" ? "Pydantic" : "Go Struct"}
                </h3>
              </div>

              {/* Copy & Download Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  disabled={!generatedCode}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={downloadFile}
                  disabled={!generatedCode}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5 text-violet-600" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Generated Code Area */}
            <div className="relative">
              <pre className="h-[432px] overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed shadow-inner">
                {generatedCode || (
                  <span className="text-slate-500">
                    // Paste valid JSON on the left to generate schema and types...
                  </span>
                )}
              </pre>
            </div>
          </div>

          {/* Formatting Options Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Settings2 className="h-3.5 w-3.5 text-violet-600" />
              <span>Options:</span>
            </div>

            {target === "typescript" && (
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTypeAlias}
                  onChange={(e) => setUseTypeAlias(e.target.checked)}
                  className="rounded accent-violet-600"
                />
                <span>Use <code>type</code> alias</span>
              </label>
            )}

            {(target === "typescript" || target === "zod") && (
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportPrefix}
                  onChange={(e) => setExportPrefix(e.target.checked)}
                  className="rounded accent-violet-600"
                />
                <span>Include <code>export</code></span>
              </label>
            )}

            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={optionalFields}
                onChange={(e) => setOptionalFields(e.target.checked)}
                className="rounded accent-violet-600"
              />
              <span>Optional fields (?)</span>
            </label>

            {target === "typescript" && (
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readonlyFields}
                  onChange={(e) => setReadonlyFields(e.target.checked)}
                  className="rounded accent-violet-600"
                />
                <span>Readonly properties</span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

