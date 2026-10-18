"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  Check,
  Clock,
  Code2,
  Copy,
  Download,
  HardDrive,
  Layers,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/browser-utils";
import { apiParams, apiSnippet, API_TIMEOUT_MS, compileApiRequest, readApiText, sanitizeApiRequest } from "@/lib/api-request";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

interface SavedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  authType: "none" | "bearer" | "basic" | "apikey";
  bearerToken: string;
  basicUser: string;
  basicPass: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyPlacement: "header" | "query";
  bodyType: "none" | "json" | "form-data" | "urlencoded" | "raw";
  bodyRaw: string;
  bodyJson: string;
  bodyFormData: KeyValuePair[];
  timestamp: number;
}

const METHOD_COLORS: Record<HttpMethod, { text: string; bg: string; border: string }> = {
  GET: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" },
  POST: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" },
  PUT: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300" },
  PATCH: { text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-300" },
  DELETE: { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300" },
  HEAD: { text: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" },
  OPTIONS: { text: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" },
};

const PRESETS = [
  {
    label: "JSONPlaceholder - List Posts (GET)",
    method: "GET" as HttpMethod,
    url: "https://jsonplaceholder.typicode.com/posts?_limit=5",
    body: "",
  },
  {
    label: "JSONPlaceholder - Create Post (POST)",
    method: "POST" as HttpMethod,
    url: "https://jsonplaceholder.typicode.com/posts",
    body: JSON.stringify({ title: "My Test Post", body: "Hello from REST API Client!", userId: 1 }, null, 2),
  },
  {
    label: "HTTPBin - Echo Headers (GET)",
    method: "GET" as HttpMethod,
    url: "https://httpbin.org/headers",
    body: "",
  },
  {
    label: "ReqRes - Single User (GET)",
    method: "GET" as HttpMethod,
    url: "https://reqres.in/api/users/2",
    body: "",
  },
  {
    label: "GitHub API - Public Profile (GET)",
    method: "GET" as HttpMethod,
    url: "https://api.github.com/users/octocat",
    body: "",
  },
];

export function ApiClientTool() {
  // Main Request Configuration
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const [useProxy, setUseProxy] = useState(true);

  // Tabs for Request Editor
  const [activeReqTab, setActiveReqTab] = useState<"params" | "headers" | "auth" | "body" | "code">("params");

  // Query Params
  const [params, setParams] = useState<KeyValuePair[]>([
    { id: "1", key: "_limit", value: "5", enabled: true },
  ]);

  // Headers
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: "1", key: "Accept", value: "application/json", enabled: true },
  ]);

  // Authentication
  const [authType, setAuthType] = useState<"none" | "bearer" | "basic" | "apikey">("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [apiKeyName, setApiKeyName] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyPlacement, setApiKeyPlacement] = useState<"header" | "query">("header");

  // Body
  const [bodyType, setBodyType] = useState<"none" | "json" | "form-data" | "urlencoded" | "raw">("none");
  const [bodyJson, setBodyJson] = useState('{\n  "name": "Alex",\n  "role": "Developer"\n}');
  const [bodyFormData, setBodyFormData] = useState<KeyValuePair[]>([
    { id: "1", key: "key", value: "value", enabled: true },
  ]);
  const [bodyRaw, setBodyRaw] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Response State
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    durationMs: number;
    sizeBytes: number;
    headers: Record<string, string>;
    data: string;
    contentType: string;
    isError?: boolean;
  } | null>(null);

  // Response Viewer Tabs
  const [activeRespTab, setActiveRespTab] = useState<"pretty" | "raw" | "preview" | "headers">("pretty");
  const [respCopied, setRespCopied] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const requestController = useRef<AbortController | null>(null);

  // Code Snippet Target Language
  const [codeLang, setCodeLang] = useState<"curl" | "js" | "node" | "python" | "php" | "go">("curl");
  const [codeCopied, setCodeCopied] = useState(false);

  // History & Collections
  const [history, setHistory] = useState<SavedRequest[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const persistRequests = (key: string, items: SavedRequest[]) => {
    try { localStorage.setItem(key, JSON.stringify(items)); }
    catch { setStorageNotice("Browser storage is unavailable. Requests will only be kept for this visit."); }
  };

  useEffect(() => {
    for (const [key, setter] of [
      ["msyn_api_client_history", setHistory], ["msyn_api_client_saved", setSavedRequests],
    ] as const) {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
        const items = Array.isArray(parsed) ? parsed.filter(item => item && typeof item.url === "string" && item.method in METHOD_COLORS).map(item => sanitizeApiRequest(item as SavedRequest)) : [];
        setter(items);
        localStorage.setItem(key, JSON.stringify(items));
      } catch { setStorageNotice("Some saved requests could not be loaded. Browser storage may be unavailable."); }
    }
    return () => { requestController.current?.abort(); };
  }, []);

  // Update URL when params change
  const syncUrlWithParams = (newParams: KeyValuePair[]) => {
    try {
      const parsedUrl = new URL(url.includes("://") ? url : `https://${url}`);
      parsedUrl.search = "";
      newParams.forEach((p) => {
        if (p.enabled && p.key.trim()) {
          parsedUrl.searchParams.append(p.key.trim(), p.value);
        }
      });
      setUrl(parsedUrl.toString());
    } catch {}
  };

  // Sync params table when user edits the URL text directly
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setParams(apiParams(newUrl));
  };

  // Add / Delete Key-Value Rows
  const addParamRow = () => {
    const updated = [...params, { id: String(Date.now()), key: "", value: "", enabled: true }];
    setParams(updated);
  };

  const removeParamRow = (id: string) => {
    const updated = params.filter((p) => p.id !== id);
    setParams(updated);
    syncUrlWithParams(updated);
  };

  const updateParamRow = (id: string, field: "key" | "value" | "enabled", val: any) => {
    const updated = params.map((p) => (p.id === id ? { ...p, [field]: val } : p));
    setParams(updated);
    syncUrlWithParams(updated);
  };

  // Header helpers
  const addHeaderRow = () => {
    setHeaders([...headers, { id: String(Date.now()), key: "", value: "", enabled: true }]);
  };

  const removeHeaderRow = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const updateHeaderRow = (id: string, field: "key" | "value" | "enabled", val: any) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  // Format JSON button
  const formatJson = () => {
    try {
      const parsed = JSON.parse(bodyJson);
      setBodyJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: any) {
      setJsonError("Invalid JSON syntax: " + e.message);
    }
  };

  const currentConfig = () => ({ method, url, headers, authType, bearerToken, basicUser, basicPass,
    apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData });

  const handleSend = async () => {
    if (!url.trim() || requestController.current) return;
    const controller = new AbortController();
    requestController.current = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(API_TIMEOUT_MS)]);
    setLoading(true);
    setResponse(null);
    setJsonError(null);
    const startTime = performance.now();
    try {
      const compiled = compileApiRequest(currentConfig());
      if (useProxy) {
        const res = await fetch("/api/proxy", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(compiled), signal,
        });
        const json = await res.json();
        if (typeof json.data !== "string" || !json.headers || typeof json.status !== "number") {
          throw new Error(json.error || "The proxy returned an invalid response.");
        }
        setResponse(json);
      } else {
        const res = await fetch(compiled.url, { method, headers: compiled.headers, body: compiled.body, signal });
        const text = await readApiText(res);
        setResponse({ status: res.status, statusText: res.statusText || (res.ok ? "OK" : "Error"),
          durationMs: Math.round(performance.now() - startTime), sizeBytes: new TextEncoder().encode(text).length,
          headers: Object.fromEntries(res.headers), data: text, contentType: res.headers.get("content-type") || "text/plain" });
      }
      const histItem = sanitizeApiRequest({ ...currentConfig(), params, id: crypto.randomUUID(),
        name: method + " request", timestamp: Date.now() });
      setHistory(previous => {
        const updated = [histItem, ...previous].slice(0, 25);
        persistRequests("msyn_api_client_history", updated);
        return updated;
      });
    } catch (error: unknown) {
      const message = signal.aborted ? (controller.signal.aborted ? "Request cancelled." : "Request timed out after 30 seconds.")
        : error instanceof Error ? error.message : "Request failed.";
      setResponse({ status: 0, statusText: signal.aborted ? "Request stopped" : "Request Error", durationMs: Math.round(performance.now() - startTime),
        sizeBytes: 0, headers: {}, data: message, contentType: "text/plain", isError: true });
    } finally {
      if (requestController.current === controller) requestController.current = null;
      setLoading(false);
    }
  };

  // Restore request from history or saved collection
  const restoreRequest = (item: SavedRequest) => {
    setMethod(item.method);
    setUrl(item.url);
    setParams(item.params || []);
    setHeaders(item.headers || []);
    setAuthType(item.authType || "none");
    setBearerToken(item.bearerToken || "");
    setBasicUser(item.basicUser || "");
    setBasicPass(item.basicPass || "");
    setApiKeyName(item.apiKeyName || "X-API-Key");
    setApiKeyValue(item.apiKeyValue || "");
    setApiKeyPlacement(item.apiKeyPlacement || "header");
    setBodyType(item.bodyType || "none");
    setBodyJson(item.bodyJson || "");
    setBodyRaw(item.bodyRaw || "");
    setJsonError(null);
    setBodyFormData(item.bodyFormData || []);
  };

  // Save request to collections
  const handleSaveCollection = () => {
    if (!saveName.trim()) return;
    const newItem: SavedRequest = sanitizeApiRequest({
      id: String(Date.now()),
      name: saveName.trim(),
      method,
      url,
      params,
      headers,
      authType,
      bearerToken,
      basicUser,
      basicPass,
      apiKeyName,
      apiKeyValue,
      apiKeyPlacement,
      bodyType,
      bodyJson,
      bodyRaw,
      bodyFormData,
      timestamp: Date.now(),
    });
    const updated = [newItem, ...savedRequests];
    setSavedRequests(updated);
    persistRequests("msyn_api_client_saved", updated);
    setSaveModalOpen(false);
    setSaveName("");
  };

  const removeSavedRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRequests.filter((r) => r.id !== id);
    setSavedRequests(updated);
    localStorage.setItem("msyn_api_client_saved", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    persistRequests("msyn_api_client_history", []);
  };

  const generatedCode = useMemo(() => {
    try { return apiSnippet({ method, url, headers, authType, bearerToken, basicUser, basicPass,
      apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData }, codeLang); }
    catch (error) { return "Request needs attention: " + (error instanceof Error ? error.message : "Invalid request settings."); }
  }, [method, url, headers, authType, bearerToken, basicUser, basicPass, apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData, codeLang]);

  // Pretty JSON format for response display
  const formattedResponseJson = useMemo(() => {
    if (!response?.data) return "";
    try {
      const parsed = JSON.parse(response.data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response.data;
    }
  }, [response?.data]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar: History & Collections */}
      <div
        className={`${
          sidebarOpen ? "w-full lg:w-72 shrink-0" : "hidden"
        } rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Layers className="h-4 w-4 text-violet-600" />
            <span>Collections & History</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Saved Requests */}
        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Saved ({savedRequests.length})
            </span>
          </div>
          {savedRequests.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No saved requests yet.</p>
          ) : (
            <div className="space-y-1">
              {savedRequests.map((item) => (
                <div
                  key={item.id}
                  onClick={() => restoreRequest(item)}
                  className="group flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        METHOD_COLORS[item.method].bg
                      } ${METHOD_COLORS[item.method].text}`}
                    >
                      {item.method}
                    </span>
                    <span className="truncate font-medium text-slate-700">{item.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeSavedRequest(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent History ({history.length})
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[11px] text-slate-400 hover:text-rose-600"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No calls made yet.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreRequest(item)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs transition hover:bg-violet-50/50"
                  >
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        METHOD_COLORS[item.method].bg
                      } ${METHOD_COLORS[item.method].text}`}
                    >
                      {item.method}
                    </span>
                    <span className="truncate text-slate-600 font-mono text-[11px]">
                      {item.url.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Request & Response Workbench */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Top Control Bar: Method + URL + Send + Save */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                  title="Show Collections Sidebar"
                >
                  <Layers className="h-4 w-4" />
                </button>
              )}
              <span className="text-xs font-semibold text-slate-500">Preset APIs:</span>
              <select
                onChange={(e) => {
                  const preset = PRESETS.find((p) => p.label === e.target.value);
                  if (preset) {
                    setMethod(preset.method);
                    handleUrlChange(preset.url);
                    setAuthType("none");
                    setBodyType(preset.body ? "json" : "none");
                    setJsonError(null);
                    if (preset.body) {
                      setBodyType("json");
                      setBodyJson(preset.body);
                    }
                  }
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none"
              >
                <option value="">Select an example API...</option>
                {PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {/* CORS Proxy Switch */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600" title="Bypasses browser CORS restrictions by routing request through local proxy">
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-violet-600 focus:ring-violet-500"
                />
                <span>CORS Proxy (Recommended)</span>
              </label>

              <button
                type="button"
                onClick={() => setSaveModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Bookmark className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500" role="note">Requests time out after 30 seconds. The proxy accepts public HTTP(S) endpoints only. Use direct mode for local APIs. History and collections save request bodies locally; authentication values and custom header values are cleared when saved.</p>
          {storageNotice && <p role="status" className="text-xs text-amber-700">{storageNotice}</p>}
          {/* URL & Method Input Bar */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className={`rounded-xl border font-mono text-sm font-bold px-3 py-2.5 outline-none transition ${
                METHOD_COLORS[method].bg
              } ${METHOD_COLORS[method].text} ${METHOD_COLORS[method].border}`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>

            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSend();
                }
              }}
              placeholder="https://api.example.com/v1/resource"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !url.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send
                </>
              )}
            </button>
            {loading && <button type="button" onClick={() => requestController.current?.abort()} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel request</button>}
          </div>
        </div>

        {/* Request Setup Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/70 px-4">
            {[
              { id: "params", label: `Params (${params.filter((p) => p.enabled && p.key).length})` },
              { id: "headers", label: `Headers (${headers.filter((h) => h.enabled && h.key).length})` },
              { id: "auth", label: `Auth (${authType !== "none" ? "1" : "0"})` },
              { id: "body", label: `Body (${bodyType !== "none" ? bodyType : "0"})` },
              { id: "code", label: "Code Snippet", icon: Code2 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveReqTab(tab.id as any)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                  activeReqTab === tab.id
                    ? "border-violet-600 text-violet-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* PARAMS TAB */}
            {activeReqTab === "params" && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 mb-1">
                  Query parameters appended to the URL query string.
                </div>
                <div className="space-y-2">
                  {params.map((param) => (
                    <div key={param.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) => updateParamRow(param.id, "enabled", e.target.checked)}
                        className="h-4 w-4 rounded text-violet-600 focus:ring-violet-500"
                      />
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => updateParamRow(param.id, "key", e.target.value)}
                        placeholder="Key (e.g. page)"
                        className="w-1/3 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateParamRow(param.id, "value", e.target.value)}
                        placeholder="Value (e.g. 1)"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeParamRow(param.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addParamRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 pt-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Parameter
                </button>
              </div>
            )}

            {/* HEADERS TAB */}
            {activeReqTab === "headers" && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 mb-1">
                  HTTP request headers sent with this request.
                </div>
                <div className="space-y-2">
                  {headers.map((header) => (
                    <div key={header.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => updateHeaderRow(header.id, "enabled", e.target.checked)}
                        className="h-4 w-4 rounded text-violet-600 focus:ring-violet-500"
                      />
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeaderRow(header.id, "key", e.target.value)}
                        placeholder="Header (e.g. Authorization, Content-Type)"
                        className="w-1/3 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeaderRow(header.id, "value", e.target.value)}
                        placeholder="Value (e.g. application/json)"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeaderRow(header.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addHeaderRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 pt-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Header
                </button>
              </div>
            )}

            {/* AUTH TAB */}
            {activeReqTab === "auth" && (
              <div className="space-y-4">
                <div className="flex gap-2 border-b border-slate-100 pb-3">
                  {[
                    { id: "none", label: "No Auth" },
                    { id: "bearer", label: "Bearer Token" },
                    { id: "basic", label: "Basic Auth" },
                    { id: "apikey", label: "API Key" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAuthType(a.id as any)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        authType === a.id
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                {authType === "bearer" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Token (JWT / OAuth)
                    </label>
                    <input
                      type="text"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                {authType === "basic" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={basicUser}
                        onChange={(e) => setBasicUser(e.target.value)}
                        placeholder="admin"
                        className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={basicPass}
                        onChange={(e) => setBasicPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                {authType === "apikey" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Key Name</label>
                      <input
                        type="text"
                        value={apiKeyName}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        placeholder="X-API-Key"
                        className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Key Value</label>
                      <input
                        type="text"
                        value={apiKeyValue}
                        onChange={(e) => setApiKeyValue(e.target.value)}
                        placeholder="secret_key_..."
                        className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Add To</label>
                      <select
                        value={apiKeyPlacement}
                        onChange={(e) => setApiKeyPlacement(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none"
                      >
                        <option value="header">Header</option>
                        <option value="query">Query Params</option>
                      </select>
                    </div>
                  </div>
                )}

                {authType === "none" && (
                  <p className="text-xs text-slate-400 italic">This request does not use any authorization.</p>
                )}
              </div>
            )}

            {/* BODY TAB */}
            {activeReqTab === "body" && (
              <div className="space-y-4">
                <div className="flex gap-2 border-b border-slate-100 pb-3">
                  {[
                    { id: "none", label: "none" },
                    { id: "json", label: "JSON (application/json)" },
                    { id: "urlencoded", label: "x-www-form-urlencoded" },
                    { id: "raw", label: "raw text" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBodyType(b.id as any)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        bodyType === b.id
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {bodyType === "json" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">JSON Payload</span>
                      <button
                        type="button"
                        onClick={formatJson}
                        className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-violet-600" /> Beautify JSON
                      </button>
                    </div>
                    <textarea
                      value={bodyJson}
                      onChange={(e) => {
                        setBodyJson(e.target.value);
                        setJsonError(null);
                      }}
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-emerald-400 outline-none focus:border-violet-500"
                    />
                    {jsonError && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <AlertCircle className="h-4 w-4" /> {jsonError}
                      </div>
                    )}
                  </div>
                )}

                {bodyType === "urlencoded" && (
                  <div className="space-y-2">
                    {bodyFormData.map((row) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => {
                            setBodyFormData(
                              bodyFormData.map((r) =>
                                r.id === row.id ? { ...r, enabled: e.target.checked } : r
                              )
                            );
                          }}
                          className="h-4 w-4 rounded text-violet-600 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) => {
                            setBodyFormData(
                              bodyFormData.map((r) =>
                                r.id === row.id ? { ...r, key: e.target.value } : r
                              )
                            );
                          }}
                          placeholder="Key"
                          className="w-1/3 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => {
                            setBodyFormData(
                              bodyFormData.map((r) =>
                                r.id === row.id ? { ...r, value: e.target.value } : r
                              )
                            );
                          }}
                          placeholder="Value"
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {bodyType === "raw" && (
                  <textarea
                    value={bodyRaw}
                    onChange={(e) => setBodyRaw(e.target.value)}
                    rows={8}
                    placeholder="Raw request body string..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                )}

                {bodyType === "none" && (
                  <p className="text-xs text-slate-400 italic">This request does not have a body.</p>
                )}
              </div>
            )}

            {/* CODE SNIPPET TAB */}
            {activeReqTab === "code" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex gap-1.5">
                    {[
                      { id: "curl", label: "cURL" },
                      { id: "js", label: "JavaScript (Fetch)" },
                      { id: "node", label: "Node.js (Axios)" },
                      { id: "python", label: "Python (requests)" },
                      { id: "php", label: "PHP (curl)" },
                      { id: "go", label: "Go" },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setCodeLang(lang.id as any)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          codeLang === lang.id
                            ? "bg-violet-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {codeCopied ? "Copied!" : "Copy Snippet"}
                  </button>
                </div>

                <pre className="max-h-72 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* RESPONSE PANEL */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Response</span>

              {response && (
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                      response.status >= 200 && response.status < 300
                        ? "bg-emerald-100 text-emerald-800"
                        : response.status >= 400
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="h-3 w-3" /> {response.durationMs} ms
                  </span>

                  <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <HardDrive className="h-3 w-3" /> {formatBytes(response.sizeBytes)}
                  </span>
                </div>
              )}
            </div>

            {response && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(response.data);
                    setRespCopied(true);
                    setTimeout(() => setRespCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {respCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {respCopied ? "Copied" : "Copy"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([response.data], { type: response.contentType });
                    const isJson = response.contentType.includes("json");
                    downloadBlob(blob, `response-${Date.now()}.${isJson ? "json" : "txt"}`);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            )}
          </div>

          {/* Response Viewer Tabs */}
          {response ? (
            <div>
              <div className="flex border-b border-slate-100 px-4 pt-2">
                {[
                  { id: "pretty", label: "Pretty" },
                  { id: "raw", label: "Raw" },
                  { id: "preview", label: "Preview" },
                  { id: "headers", label: `Headers (${Object.keys(response.headers).length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveRespTab(t.id as any)}
                    className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
                      activeRespTab === t.id
                        ? "border-violet-600 text-violet-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeRespTab === "pretty" && (
                  <pre className="max-h-[500px] overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed">
                    <code>{formattedResponseJson}</code>
                  </pre>
                )}

                {activeRespTab === "raw" && (
                  <pre className="max-h-[500px] overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-300">
                    <code>{response.data}</code>
                  </pre>
                )}

                {activeRespTab === "preview" && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <iframe
                      srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'">${response.data}`}
                      title="Response Preview"
                      sandbox=""
                      referrerPolicy="no-referrer"
                      className="h-80 w-full"
                    />
                  </div>
                )}

                {activeRespTab === "headers" && (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {Object.entries(response.headers).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-start gap-4 rounded-lg bg-slate-50 p-2 font-mono text-xs"
                      >
                        <span className="w-1/3 font-bold text-slate-800">{key}</span>
                        <span className="flex-1 break-all text-slate-600">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Terminal className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No response to display yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Enter an API URL above and click <strong>Send</strong> or press <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono">Ctrl+Enter</kbd> to inspect the response.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Save to Collections</h3>
            <p className="text-xs text-slate-500">
              Give this request a recognizable name to quickly restore it anytime.
            </p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Get User Posts"
              autoFocus
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCollection}
                disabled={!saveName.trim()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
