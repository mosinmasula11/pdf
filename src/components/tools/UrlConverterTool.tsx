"use client";

import { useState, useEffect } from "react";
import {
  Link2,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowRightLeft,
  Sparkles,
  Settings2,
  FileCode,
  Globe,
} from "lucide-react";

type QueryParam = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export function UrlConverterTool() {
  const [activeTab, setActiveTab] = useState<"params" | "encoder">("params");

  // Tab 1: Query Param Parser & Builder states
  const [urlInput, setUrlInput] = useState<string>(
    "https://api.example.com/v2/search?query=antigravity+ai&sort=relevance&limit=20&page=1&filter_active=true#results"
  );
  const [protocol, setProtocol] = useState<string>("https:");
  const [host, setHost] = useState<string>("api.example.com");
  const [pathname, setPathname] = useState<string>("/v2/search");
  const [hash, setHash] = useState<string>("#results");
  const [queryParams, setQueryParams] = useState<QueryParam[]>([
    { id: "1", key: "query", value: "antigravity ai", enabled: true },
    { id: "2", key: "sort", value: "relevance", enabled: true },
    { id: "3", key: "limit", value: "20", enabled: true },
    { id: "4", key: "page", value: "1", enabled: true },
    { id: "5", key: "filter_active", value: "true", enabled: true },
  ]);
  const [reconstructedUrl, setReconstructedUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Tab 2: Raw Encoder / Decoder states
  const [rawInput, setRawInput] = useState<string>("Hello World! Welcome to msyn.in?param=foo&bar=123");
  const [encoderMode, setEncoderMode] = useState<"encode" | "decode">("encode");
  const [encodeLevel, setEncodeLevel] = useState<"component" | "full">("component");
  const [rawOutput, setRawOutput] = useState<string>("");
  const [rawError, setRawError] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Parse incoming URL when user types/pastes into urlInput
  const parseFullUrl = (urlString: string) => {
    setUrlInput(urlString);
    if (!urlString.trim()) {
      setQueryParams([]);
      setReconstructedUrl("");
      setUrlError(null);
      return;
    }

    try {
      // Ensure protocol for valid URL constructor if omitted
      let parseable = urlString.trim();
      if (!parseable.includes("://") && !parseable.startsWith("/")) {
        parseable = "https://" + parseable;
      }

      const parsed = new URL(parseable, "https://dummy.base");
      setProtocol(parsed.protocol);
      setHost(parsed.host);
      setPathname(parsed.pathname);
      setHash(parsed.hash);

      const params: QueryParam[] = [];
      let index = 1;
      parsed.searchParams.forEach((val, key) => {
        params.push({
          id: `${index++}`,
          key,
          value: val,
          enabled: true,
        });
      });

      setQueryParams(params);
      setUrlError(null);
    } catch {
      setUrlError("Could not parse as a valid URL.");
    }
  };

  // Rebuild URL whenever protocol, host, pathname, hash, or queryParams change
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams();
      queryParams.forEach((p) => {
        if (p.enabled && p.key.trim()) {
          searchParams.append(p.key.trim(), p.value);
        }
      });

      const queryString = searchParams.toString();
      const base = `${protocol}//${host}${pathname.startsWith("/") ? pathname : "/" + pathname}`;
      const full = `${base}${queryString ? `?${queryString}` : ""}${hash ? (hash.startsWith("#") ? hash : "#" + hash) : ""}`;

      setReconstructedUrl(full);
    } catch {
      setReconstructedUrl("");
    }
  }, [protocol, host, pathname, hash, queryParams]);

  // Tab 2: Raw Encoder / Decoder logic
  useEffect(() => {
    setRawError(null);
    if (!rawInput) {
      setRawOutput("");
      return;
    }

    try {
      if (encoderMode === "encode") {
        if (encodeLevel === "component") {
          setRawOutput(encodeURIComponent(rawInput));
        } else {
          setRawOutput(encodeURI(rawInput));
        }
      } else {
        if (encodeLevel === "component") {
          setRawOutput(decodeURIComponent(rawInput));
        } else {
          setRawOutput(decodeURI(rawInput));
        }
      }
    } catch (e) {
      setRawError("Malformed URI sequence: " + (e instanceof Error ? e.message : "Error"));
      setRawOutput("");
    }
  }, [rawInput, encoderMode, encodeLevel]);

  const addParam = () => {
    setQueryParams((prev) => [
      ...prev,
      { id: Date.now().toString(), key: "", value: "", enabled: true },
    ]);
  };

  const removeParam = (id: string) => {
    setQueryParams((prev) => prev.filter((p) => p.id !== id));
  };

  const updateParam = (id: string, field: "key" | "value" | "enabled", val: unknown) => {
    setQueryParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportParamsJson = () => {
    const obj: Record<string, string> = {};
    queryParams.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        obj[p.key.trim()] = p.value;
      }
    });
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("params")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "params"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Query Param Inspector & URL Builder</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("encoder")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "encoder"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Quick URL Encoder & Decoder</span>
        </button>
      </div>

      {/* Tab 1: Query Param Parser & Builder */}
      {activeTab === "params" && (
        <div className="space-y-6">
          {/* Paste URL Input */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Paste Any URL to Inspect & Edit
              </label>
              <button
                type="button"
                onClick={() =>
                  parseFullUrl(
                    "https://api.example.com/v2/search?query=antigravity+ai&sort=relevance&limit=20&page=1&filter_active=true#results"
                  )
                }
                className="text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                Reset Example
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => parseFullUrl(e.target.value)}
                placeholder="https://example.com/path?key=value&foo=bar#section"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-xs text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            {urlError && <p className="text-xs text-red-600 font-medium">{urlError}</p>}
          </div>

          {/* URL Structure Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Protocol</span>
              <input
                type="text"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-800"
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-500">Host / Domain</span>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-800"
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Pathname</span>
              <input
                type="text"
                value={pathname}
                onChange={(e) => setPathname(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Query Parameters Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Query Parameters ({queryParams.filter((p) => p.enabled).length} active)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addParam}
                  className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Param</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText(exportParamsJson(), "jsonParams")}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copiedKey === "jsonParams" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <FileCode className="h-3.5 w-3.5" />
                  )}
                  <span>Copy JSON</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {queryParams.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No query parameters found. Click &quot;Add Param&quot; above to create one.
                </div>
              ) : (
                queryParams.map((param) => (
                  <div
                    key={param.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition ${
                      param.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateParam(param.id, "enabled", e.target.checked)}
                      className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                      title={param.enabled ? "Disable parameter" : "Enable parameter"}
                    />
                    <input
                      type="text"
                      placeholder="key"
                      value={param.key}
                      onChange={(e) => updateParam(param.id, "key", e.target.value)}
                      className="w-1/3 rounded border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                    />
                    <span className="text-slate-400 font-bold">=</span>
                    <input
                      type="text"
                      placeholder="value"
                      value={param.value}
                      onChange={(e) => updateParam(param.id, "value", e.target.value)}
                      className="flex-1 rounded border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeParam(param.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      title="Delete parameter"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reconstructed URL Output */}
          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-900">
                Reconstructed Live URL
              </span>
              <button
                type="button"
                onClick={() => copyText(reconstructedUrl, "reconstructed")}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
              >
                {copiedKey === "reconstructed" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Full URL</span>
                  </>
                )}
              </button>
            </div>
            <div className="rounded-lg bg-white p-3 font-mono text-xs text-slate-900 border border-violet-200 break-all select-all">
              {reconstructedUrl || "URL will appear here"}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Raw URL / Component Encoder & Decoder */}
      {activeTab === "encoder" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Action:</span>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setEncoderMode("encode")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    encoderMode === "encode"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Encode
                </button>
                <button
                  type="button"
                  onClick={() => setEncoderMode("decode")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    encoderMode === "decode"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Decode
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Method:</span>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setEncodeLevel("component")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    encodeLevel === "component"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="encodeURIComponent - Encodes all special characters including & = / ?"
                >
                  Component (URI Component)
                </button>
                <button
                  type="button"
                  onClick={() => setEncodeLevel("full")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    encodeLevel === "full"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="encodeURI - Preserves full URL structure characters (: / ? & =)"
                >
                  Full URL (URI)
                </button>
              </div>
            </div>
          </div>

          {/* Input & Output Textareas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {encoderMode === "encode" ? "Raw Text / URL to Encode" : "Encoded String to Decode"}
                </span>
                <button
                  type="button"
                  onClick={() => setRawInput("")}
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  Clear
                </button>
              </div>
              <textarea
                rows={9}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Type or paste text here..."
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-400">
                Length: {rawInput.length} characters
              </div>
            </div>

            {/* Output Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {encoderMode === "encode" ? "Encoded Result" : "Decoded Result"}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(rawOutput, "rawOut")}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  {copiedKey === "rawOut" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={9}
                readOnly
                value={rawOutput}
                placeholder="Result will appear here..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Length: {rawOutput.length} characters</span>
                <button
                  type="button"
                  onClick={() => {
                    setRawInput(rawOutput);
                    setEncoderMode((prev) => (prev === "encode" ? "decode" : "encode"));
                  }}
                  className="text-violet-600 hover:underline"
                >
                  Swap & Invert
                </button>
              </div>
            </div>
          </div>

          {rawError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {rawError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

