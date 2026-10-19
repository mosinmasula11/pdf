"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Bookmark,
  Check,
  Clock,
  Copy,
  Download,
  HardDrive,
  Layers,
  Folder,
  ChevronDown,
  ChevronRight,
  Pencil,
  Search,
  Upload,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Braces,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/browser-utils";
import { DEFAULT_COLLECTION, exportApiCollection, groupApiHistory, importApiCollection, normalizeCollections } from "@/lib/api-workspace";
import type { ApiCollection } from "@/lib/api-workspace";
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
  collectionId?: string;
}

type ApiResponse = {
    status: number;
    statusText: string;
    durationMs: number;
    sizeBytes: number;
    headers: Record<string, string>;
    data: string;
    contentType: string;
    isError?: boolean;
  };
interface OpenRequestTab { id: string; name: string; request: SavedRequest | null; response: ApiResponse | null; proxy: boolean; savedId: string | null }
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
    label: "HTTPBin - Request Details (GET)",
    method: "GET" as HttpMethod,
    url: "https://httpbin.org/anything",
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
  const [response, setResponse] = useState<ApiResponse | null>(null);

  // Response Viewer Tabs
  const [activeRespTab, setActiveRespTab] = useState<"pretty" | "raw" | "preview" | "headers">("pretty");
  const [respCopied, setRespCopied] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const requestController = useRef<AbortController | null>(null);
  const requestStartedAt = useRef(0);

  // Code Snippet Target Language
  const [codeLang, setCodeLang] = useState<"curl" | "js" | "node" | "python" | "php" | "go">("curl");
  const [codeCopied, setCodeCopied] = useState(false);

  // History & Collections
  const [history, setHistory] = useState<SavedRequest[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collections, setCollections] = useState<ApiCollection[]>([DEFAULT_COLLECTION]);
  const [collectionId, setCollectionId] = useState(DEFAULT_COLLECTION.id);
  const [libraryView, setLibraryView] = useState<"collections" | "history">("collections");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [collectionMenu, setCollectionMenu] = useState<{ collection: ApiCollection; left: number; top: number } | null>(null);
  const collectionMenuRef = useRef<HTMLDivElement>(null);
  const collectionMenuTrigger = useRef<HTMLButtonElement>(null);
  const [collapsedCollections, setCollapsedCollections] = useState<Record<string, boolean>>({});
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenRequestTab[]>([{ id: "initial", name: "Untitled request", request: null, response: null, proxy: true, savedId: null }]);
  const [activeTabId, setActiveTabId] = useState("initial");
  const [draftName, setDraftName] = useState("Untitled request");
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const collectionDialog = useRef<HTMLDialogElement>(null);
  const collectionFile = useRef<HTMLInputElement>(null);
  const saveDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!collectionMenu) return;
    collectionMenuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const outside = (event: PointerEvent) => { if (!collectionMenuRef.current?.contains(event.target as Node)) setCollectionMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setCollectionMenu(null); collectionMenuTrigger.current?.focus(); } };
    const close = () => setCollectionMenu(null);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); document.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [collectionMenu]);
  useEffect(() => {
    if (collectionModalOpen) { collectionDialog.current?.showModal(); collectionDialog.current?.querySelector<HTMLInputElement>("input")?.focus(); }
    else collectionDialog.current?.close();
  }, [collectionModalOpen]);
  useEffect(() => {
    if (saveModalOpen) {
      saveDialog.current?.showModal();
      const destination = saveDialog.current?.querySelector<HTMLSelectElement>('select[name="collection"]');
      if (destination) destination.value = collectionId;
      saveDialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
    else saveDialog.current?.close();
  }, [saveModalOpen, collectionId]);

  const persistRequests = (key: string, items: SavedRequest[]) => {
    try { localStorage.setItem(key, JSON.stringify(items)); }
    catch { setStorageNotice("Browser storage is unavailable. Requests will only be kept for this visit."); }
  };

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
    if (!mounted) return;
    try { setCollections(normalizeCollections(JSON.parse(localStorage.getItem("msyn_api_client_collections") || "[]"))); }
    catch { setStorageNotice("Collections could not be loaded from this browser."); }
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
    });
    return () => { mounted = false; requestController.current?.abort(); requestController.current = null; };
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

  const setParamsAndUrl = (rows: KeyValuePair[]) => { setParams(rows); syncUrlWithParams(rows); };

  // Format JSON button
  const formatJson = () => {
    try {
      const parsed = JSON.parse(bodyJson);
      setBodyJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: unknown) {
      setJsonError("Invalid JSON syntax: " + (e instanceof Error ? e.message : "Invalid JSON"));
    }
  };

  const currentConfig = () => ({ method, url, headers, authType, bearerToken, basicUser, basicPass,
    apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData });

  const cancelRequest = () => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
    setResponse({ status: 0, statusText: "Request stopped", durationMs: Math.round(performance.now() - requestStartedAt.current),
      sizeBytes: 0, headers: {}, data: "Request cancelled.", contentType: "text/plain", isError: true });
  };

  const handleSend = async () => {
    if (!url.trim() || requestController.current) return;
    const controller = new AbortController();
    requestController.current = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(API_TIMEOUT_MS)]);
    setLoading(true);
    setResponse(null);
    setJsonError(null);
    const startTime = performance.now();
    requestStartedAt.current = startTime;
    try {
      const compiled = compileApiRequest(currentConfig());
      const histItem = sanitizeApiRequest({ ...currentConfig(), params, id: crypto.randomUUID(),
        name: method + " request", timestamp: Date.now() });
      setHistory(previous => {
        const updated = [histItem, ...previous].slice(0, 25);
        persistRequests("msyn_api_client_history", updated);
        return updated;
      });
      if (useProxy) {
        const res = await fetch("/api/proxy", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(compiled), signal,
        });
        const json = await res.json();
        if (requestController.current !== controller) return;
        if (typeof json.data !== "string" || !json.headers || typeof json.status !== "number") {
          throw new Error(json.error || "The proxy returned an invalid response.");
        }
        setResponse({ ...json, isError: json.isError || (!res.ok && json.status === 0) });
      } else {
        const res = await fetch(compiled.url, { method, headers: compiled.headers, body: compiled.body, signal });
        const text = await readApiText(res);
        if (requestController.current !== controller) return;
        setResponse({ status: res.status, statusText: res.statusText || (res.ok ? "OK" : "Error"),
          durationMs: Math.round(performance.now() - startTime), sizeBytes: new TextEncoder().encode(text).length,
          headers: Object.fromEntries(res.headers), data: text, contentType: res.headers.get("content-type") || "text/plain" });
      }
    } catch (error: unknown) {
      if (requestController.current !== controller) return;
      if (error instanceof SyntaxError && bodyType === "json") { setJsonError("Enter a valid JSON request body."); setActiveReqTab("body"); }
      const message = signal.aborted ? (controller.signal.aborted ? "Request cancelled." : "Request timed out after 30 seconds.")
        : error instanceof Error ? error.message : "Request failed.";
      setResponse({ status: 0, statusText: signal.aborted ? "Request stopped" : "Request Error", durationMs: Math.round(performance.now() - startTime),
        sizeBytes: 0, headers: {}, data: message, contentType: "text/plain", isError: true });
    } finally {
      if (requestController.current === controller) { requestController.current = null; setLoading(false); }
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
  const handleSaveCollection = (destination = collectionId) => {
    if (!saveName.trim()) return;
    const newItem: SavedRequest = sanitizeApiRequest({
      id: activeSavedId || crypto.randomUUID(),
      name: saveName.trim(),
      collectionId: destination,
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
    const updated = [newItem, ...savedRequests.filter(item => item.id !== newItem.id)];
    setDraftName(newItem.name); setActiveSavedId(newItem.id); setCollectionId(destination);
    setSavedRequests(updated);
    persistRequests("msyn_api_client_saved", updated);
    setSaveModalOpen(false);
    setSaveName("");
  };

  const removeSavedRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRequests.filter((r) => r.id !== id);
    setSavedRequests(updated);
    persistRequests("msyn_api_client_saved", updated);
  };

  const clearHistory = () => {
    setHistory([]);
    persistRequests("msyn_api_client_history", []);
  };

  const persistCollections = (items: ApiCollection[]) => {
    setCollections(items);
    try { localStorage.setItem("msyn_api_client_collections", JSON.stringify(items)); }
    catch { setStorageNotice("Collections could not be saved in this browser."); }
  };
  const saveCollection = () => {
    if (!collectionName.trim()) return;
    const item = { id: editingCollection || crypto.randomUUID(), name: collectionName.trim() };
    persistCollections(editingCollection ? collections.map(entry => entry.id === item.id ? item : entry) : [...collections, item]);
    if (!editingCollection && !activeSavedId) setCollectionId(item.id);
    setCollectionModalOpen(false);
  };
  const removeCollection = (id: string) => {
    persistCollections(collections.filter(item => item.id !== id));
    setOpenTabs(tabs => tabs.map(tab => tab.request?.collectionId === id ? { ...tab, request: { ...tab.request, collectionId: DEFAULT_COLLECTION.id } } : tab));
    const items = savedRequests.map(item => item.collectionId === id ? { ...item, collectionId: DEFAULT_COLLECTION.id } : item);
    setSavedRequests(items); persistRequests("msyn_api_client_saved", items);
    if (collectionId === id) setCollectionId(DEFAULT_COLLECTION.id);
  };
  const exportCollection = (item: ApiCollection) => {
    try {
      const data = exportApiCollection(item.name, savedRequests.filter(request => (request.collectionId || DEFAULT_COLLECTION.id) === item.id));
      downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), (item.name.replace(/[^a-z0-9]+/gi, "-") || "collection") + ".postman_collection.json");
    } catch (error) { setLibraryError(error instanceof Error ? error.message : "Collection export failed."); }
  };
  const importCollection = async (file?: File) => {
    if (!file) return;
    setLibraryError("");
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("Choose a collection JSON file smaller than 2 MB.");
      const imported = importApiCollection(JSON.parse(await file.text()));
      const item = { id: crypto.randomUUID(), name: imported.name };
      const requests: SavedRequest[] = imported.requests.map(request => ({ ...request, id: crypto.randomUUID(), collectionId: item.id, timestamp: Date.now() }));
      persistCollections([...collections, item]);
      const updated = [...requests, ...savedRequests]; setSavedRequests(updated); persistRequests("msyn_api_client_saved", updated);
      setLibraryView("collections"); setLibrarySearch(""); setStorageNotice("Imported " + requests.length + " requests. Re-enter authentication values before sending.");
    } catch (error) { setLibraryError(error instanceof Error ? error.message : "Collection import failed."); }
    if (collectionFile.current) collectionFile.current.value = "";
  };
  const draftRequest = (): SavedRequest => ({ ...currentConfig(), params, id: activeSavedId || activeTabId, name: draftName, collectionId, timestamp: Date.now() });
  const checkpointTabs = () => {
    const stopped = requestController.current ? { status: 0, statusText: "Request stopped", durationMs: Math.round(performance.now() - requestStartedAt.current),
      sizeBytes: 0, headers: {}, data: "Request cancelled.", contentType: "text/plain", isError: true } : response;
    if (requestController.current) cancelRequest();
    return openTabs.map(tab => tab.id === activeTabId ? { ...tab, name: draftName, request: draftRequest(), response: stopped, proxy: useProxy, savedId: activeSavedId } : tab);
  };
  const selectRequestTab = (id: string) => {
    if (id === activeTabId) return;
    const tabs = checkpointTabs(), tab = tabs.find(item => item.id === id);
    if (!tab) return;
    setOpenTabs(tabs); setActiveTabId(id); setDraftName(tab.name); setActiveSavedId(tab.savedId); setUseProxy(tab.proxy);
    if (tab.request) { restoreRequest(tab.request); setCollectionId(tab.request.collectionId || DEFAULT_COLLECTION.id); }
    setResponse(tab.response); setJsonError(null);
  };
  const openRequest = (request?: SavedRequest, saved = false, targetCollection = DEFAULT_COLLECTION.id) => {
    const existing = saved && request ? openTabs.find(tab => tab.savedId === request.id || (tab.id === activeTabId && activeSavedId === request.id)) : undefined;
    if (existing) { selectRequestTab(existing.id); return; }
    const tabs = checkpointTabs(), id = crypto.randomUUID();
    const next: SavedRequest = request || {
      method: "GET", url: "", params: [], headers: [{ id: crypto.randomUUID(), key: "Accept", value: "application/json", enabled: true }],
      authType: "none", bearerToken: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyPlacement: "header",
      bodyType: "none", bodyRaw: "", bodyJson: "", bodyFormData: [], id, name: "Untitled request", timestamp: Date.now(), collectionId: targetCollection,
    };
    const tab: OpenRequestTab = { id, name: next.name, request: next, response: null, proxy: true, savedId: saved ? next.id : null };
    setOpenTabs([...tabs, tab]); setActiveTabId(id); setDraftName(next.name); setActiveSavedId(tab.savedId);
    restoreRequest(next); setCollectionId(next.collectionId || DEFAULT_COLLECTION.id); setResponse(null); setUseProxy(true);
  };
  const closeRequestTab = (id: string) => {
    if (id !== activeTabId) { setOpenTabs(tabs => tabs.filter(tab => tab.id !== id)); return; }
    const tabs = checkpointTabs().filter(tab => tab.id !== id);
    if (!tabs.length) {
      const empty: SavedRequest = { ...draftRequest(), id: crypto.randomUUID(), name: "Untitled request", url: "", method: "GET", params: [], headers: [], authType: "none",
        bearerToken: "", basicUser: "", basicPass: "", apiKeyValue: "", bodyType: "none", bodyRaw: "", bodyJson: "", bodyFormData: [] };
      restoreRequest(empty); setActiveSavedId(null); setDraftName(empty.name); setResponse(null);
      const tab: OpenRequestTab = { id: empty.id, name: empty.name, request: empty, response: null, proxy: true, savedId: null };
      setOpenTabs([tab]); setActiveTabId(tab.id); setUseProxy(true); return;
    }
    setOpenTabs(tabs);
    if (id === activeTabId) {
      const tab = tabs[tabs.length - 1]; setActiveTabId(tab.id); setDraftName(tab.name); setActiveSavedId(tab.savedId); setUseProxy(tab.proxy); setResponse(tab.response);
      if (tab.request) { restoreRequest(tab.request); setCollectionId(tab.request.collectionId || DEFAULT_COLLECTION.id); }
    }
  };
  const matchingRequest = (item: SavedRequest) => (item.name + " " + item.url + " " + item.method).toLowerCase().includes(librarySearch.toLowerCase());
  const historyGroups = history.length ? groupApiHistory(history.filter(matchingRequest)) : [];

  const generatedCode = useMemo(() => {
    try { return apiSnippet({ method, url, headers, authType, bearerToken, basicUser, basicPass,
      apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData }, codeLang); }
    catch (error) { return "Request needs attention: " + (error instanceof Error ? error.message : "Invalid request settings."); }
  }, [method, url, headers, authType, bearerToken, basicUser, basicPass, apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData, codeLang]);

  const copyText = async (value: string) => {
    try { await navigator.clipboard.writeText(value); return true; }
    catch { setStorageNotice("Clipboard access was denied. You can download the response instead."); return false; }
  };

  // Pretty JSON format for response display
  const formattedResponseJson = useMemo(() => {
    if (!response?.data) return "";
    try {
      const parsed = JSON.parse(response.data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response.data;
    }
  }, [response]);

  return (
    <div className="min-w-0 border-y border-slate-200 bg-white" onKeyDown={(event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void handleSend(); }
    }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Layers size={17} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">My Workspace</h2>
          <span className="hidden border-l border-slate-300 pl-3 text-xs text-slate-500 sm:inline">Local workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => openRequest()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"><Plus size={14} />New request</button>
          <button type="button" onClick={() => collectionFile.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"><Upload size={14} />Import</button>
          <button type="button" aria-expanded={sidebarOpen} aria-controls="request-library" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-md border border-slate-300 p-1.5 text-slate-600 lg:hidden" aria-label="Toggle collections sidebar"><Layers size={17} /></button>
          <input ref={collectionFile} type="file" accept=".json,application/json" aria-label="Import Postman collection" className="hidden" onChange={event => void importCollection(event.target.files?.[0])} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col lg:min-h-[760px] lg:flex-row">
        <aside id="request-library" aria-label="Collections and history" className={(sidebarOpen ? "flex" : "hidden lg:flex") + " w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50 lg:w-72 lg:border-r lg:border-b-0"}>
          <div className="flex border-b border-slate-200" role="tablist" aria-label="Library">
            <button type="button" role="tab" aria-selected={libraryView === "collections"} aria-controls="library-collections" onClick={() => setLibraryView("collections")} className={"inline-flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold " + (libraryView === "collections" ? "border-[var(--brand)] bg-white text-slate-900" : "border-transparent text-slate-500")}><Folder size={15} />Collections</button>
            <button type="button" role="tab" aria-selected={libraryView === "history"} aria-controls="library-history" onClick={() => setLibraryView("history")} className={"inline-flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold " + (libraryView === "history" ? "border-[var(--brand)] bg-white text-slate-900" : "border-transparent text-slate-500")}><Clock size={15} />History</button>
          </div>
          <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-slate-400"><Search size={14} className="shrink-0" /><input type="search" aria-label="Search collections and history" value={librarySearch} onChange={event => setLibrarySearch(event.target.value)} placeholder="Search" className="h-8 min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none" /></label>
            {libraryView === "collections" ? <IconButton label="New collection" onClick={() => { setEditingCollection(null); setCollectionName(""); setCollectionModalOpen(true); }}><Plus size={16} /></IconButton>
              : <IconButton label="Clear request history" onClick={clearHistory} disabled={!history.length}><Trash2 size={15} /></IconButton>}
          </div>
          <div role="tabpanel" id={"library-" + libraryView} className="max-h-80 min-w-0 overflow-y-auto px-1 py-2 lg:max-h-[900px]">
            {libraryView === "collections" ? <>
              {collections.filter(item => item.name.toLowerCase().includes(librarySearch.toLowerCase()) || savedRequests.some(request => (request.collectionId || DEFAULT_COLLECTION.id) === item.id && matchingRequest(request))).map(item => {
                const requests = savedRequests.filter(request => (request.collectionId || DEFAULT_COLLECTION.id) === item.id && (item.name.toLowerCase().includes(librarySearch.toLowerCase()) || matchingRequest(request)));
                return <div key={item.id} className="mb-1">
                  <div className="flex items-center gap-0.5 px-1">
                    <button type="button" aria-expanded={!collapsedCollections[item.id]} onClick={() => setCollapsedCollections(previous => ({ ...previous, [item.id]: !previous[item.id] }))} className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-200/60">
                      {collapsedCollections[item.id] ? <ChevronRight size={13} className="shrink-0" /> : <ChevronDown size={13} className="shrink-0" />}<Folder size={15} className="shrink-0 text-slate-500" /><span className="truncate">{item.name}</span><span className="text-[10px] font-normal text-slate-400">{requests.length}</span>
                    </button>
                    <IconButton label={"Add request to " + item.name} onClick={() => openRequest(undefined, false, item.id)}><Plus size={14} /></IconButton>
                    <button type="button" aria-label={"Actions for " + item.name} title={"Actions for " + item.name} aria-haspopup="menu" aria-expanded={collectionMenu?.collection.id === item.id} onClick={event => {
                      const bounds = event.currentTarget.getBoundingClientRect();
                      collectionMenuTrigger.current = event.currentTarget;
                      setCollectionMenu({ collection: item, left: Math.max(8, Math.min(bounds.right - 200, window.innerWidth - 208)), top: Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - 148)) });
                    }} className="flex h-8 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200"><MoreHorizontal size={17} /></button>
                  </div>
                  {!collapsedCollections[item.id] && <div className="ml-4 border-l border-slate-200">
                    {requests.length === 0 && <p className="px-4 py-2 text-xs text-slate-400">No requests</p>}
                    {requests.map(request => <div key={request.id} className={"group flex items-center pr-1 " + (activeSavedId === request.id ? "bg-[var(--brand-soft)]" : "hover:bg-slate-200/60")}>
                      <button type="button" onClick={() => openRequest(request, true)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left">
                        <span className={"w-11 shrink-0 font-mono text-[10px] font-bold " + METHOD_COLORS[request.method].text}>{request.method}</span><span className="truncate text-xs text-slate-600">{request.name}</span>
                      </button>
                      <IconButton label={"Delete " + request.name} onClick={event => { removeSavedRequest(request.id, event); if (activeSavedId === request.id) setActiveSavedId(null); }}><Trash2 size={13} /></IconButton>
                    </div>)}
                  </div>}
                </div>;
              })}
              {librarySearch && !collections.some(item => item.name.toLowerCase().includes(librarySearch.toLowerCase()) || savedRequests.some(request => (request.collectionId || DEFAULT_COLLECTION.id) === item.id && matchingRequest(request))) && <p className="px-3 py-5 text-xs text-slate-500">No matching collections or requests.</p>}
            </> : <>
              {historyGroups.length === 0 && <p className="px-3 py-5 text-xs text-slate-500">{librarySearch ? "No matching requests." : "No recent requests."}</p>}
              {historyGroups.map(group => <div key={group.label}>
                <h3 className="px-3 py-2 text-[11px] font-semibold text-slate-500">{group.label}</h3>
                {group.requests.map(request => <div key={request.id} className="flex items-center hover:bg-slate-200/60">
                  <button type="button" title={request.url} onClick={() => openRequest({ ...request, name: request.url.replace(/^https?:\/\//, "") })} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                    <div className="flex min-w-0 items-center gap-2"><span className={"w-11 shrink-0 font-mono text-[10px] font-bold " + METHOD_COLORS[request.method].text}>{request.method}</span><span className="truncate font-mono text-[11px] text-slate-600">{request.url.replace(/^https?:\/\//, "")}</span></div>
                    <time dateTime={new Date(request.timestamp).toISOString()} className="mt-1 block pl-[52px] text-[10px] text-slate-400">{new Date(request.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                  </button>
                  <IconButton label={"Remove recent " + request.url} onClick={() => { const next = history.filter(item => item.id !== request.id); setHistory(next); persistRequests("msyn_api_client_history", next); }}><X size={13} /></IconButton>
                </div>)}
              </div>)}
            </>}
          </div>
          <p className="mt-auto border-t border-slate-200 px-3 py-3 text-[10px] text-slate-400">Saved on this browser</p>
        </aside>

        <section className="min-w-0 flex-1" aria-label="API request workbench">
          <div className="flex items-stretch border-b border-slate-200 bg-slate-50">
            <div role="tablist" aria-label="Open requests" className="flex min-w-0 flex-1 overflow-x-auto" onKeyDown={event => {
              const index = openTabs.findIndex(tab => tab.id === activeTabId);
              const next = event.key === "ArrowRight" ? (index + 1) % openTabs.length : event.key === "ArrowLeft" ? (index + openTabs.length - 1) % openTabs.length : event.key === "Home" ? 0 : event.key === "End" ? openTabs.length - 1 : -1;
              if (next >= 0) { event.preventDefault(); selectRequestTab(openTabs[next].id); event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus(); }
            }}>
              {openTabs.map(tab => <div key={tab.id} className={"flex max-w-64 min-w-36 shrink-0 items-center border-r border-slate-200 border-t-2 " + (tab.id === activeTabId ? "border-t-[var(--brand)] bg-white" : "border-t-transparent")}>
                <button type="button" role="tab" id={"open-request-" + tab.id} tabIndex={tab.id === activeTabId ? 0 : -1} aria-selected={tab.id === activeTabId} aria-controls="active-request-workbench" onClick={() => selectRequestTab(tab.id)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-xs text-slate-600">
                  <span className={"shrink-0 font-mono text-[10px] font-semibold " + METHOD_COLORS[tab.id === activeTabId ? method : tab.request?.method || "GET"].text}>{tab.id === activeTabId ? method : tab.request?.method || "GET"}</span>
                  <span className="truncate">{tab.id === activeTabId ? draftName : tab.name}</span>
                </button>
                <IconButton label={"Close " + (tab.id === activeTabId ? draftName : tab.name)} onClick={() => closeRequestTab(tab.id)}><X size={13} /></IconButton>
              </div>)}
            </div>
            <IconButton label="New request tab" onClick={() => openRequest()}><Plus size={17} /></IconButton>
          </div>
          <div id="active-request-workbench" role="tabpanel" aria-labelledby={"open-request-" + activeTabId}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
              <div className="min-w-0 break-words text-xs text-slate-500"><span>{collections.find(item => item.id === collectionId)?.name || "My collection"}</span><span className="mx-2">/</span><span className="font-semibold text-slate-800">{draftName}</span></div>
              <div className="flex min-w-0 items-center gap-2">
                <label className="sr-only" htmlFor="api-example">Example request</label>
                <select id="api-example" defaultValue="" onChange={event => {
                  const preset = PRESETS.find(item => item.label === event.target.value);
                  if (preset) { setMethod(preset.method); handleUrlChange(preset.url); setAuthType("none"); setBodyType(preset.body ? "json" : "none"); if (preset.body) setBodyJson(preset.body); setResponse(null); setJsonError(null); setActiveSavedId(null); setDraftName(preset.label); }
                  event.target.value = "";
                }} className="min-w-0 max-w-48 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-500">
                  <option value="">Example requests</option>{PRESETS.map(preset => <option key={preset.label}>{preset.label}</option>)}
                </select>
                <button type="button" onClick={() => { setSaveName(draftName === "Untitled request" ? "" : draftName); setSaveModalOpen(true); }} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Bookmark size={14} />Save request</button>
              </div>
            </div>
      <form className="flex flex-wrap items-stretch gap-2 px-4 py-4" onSubmit={(event) => { event.preventDefault(); void handleSend(); }}>
        <label className="sr-only" htmlFor="request-method">HTTP method</label>
        <select id="request-method" value={method} onChange={event => setMethod(event.target.value as HttpMethod)} className={"h-11 w-28 shrink-0 rounded-md border bg-white px-3 font-mono text-sm font-semibold " + METHOD_COLORS[method].text + " " + METHOD_COLORS[method].border}>
          {Object.keys(METHOD_COLORS).map(value => <option key={value}>{value}</option>)}
        </select>
        <label className="sr-only" htmlFor="request-url">Request URL</label>
        <input id="request-url" type="text" inputMode="url" spellCheck={false} autoComplete="off" value={url} onChange={event => handleUrlChange(event.target.value)} placeholder="https://api.example.com/v1/resource" required className="h-11 min-w-0 flex-1 basis-48 rounded-md border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" />
        {loading ? <button key="cancel" type="button" onClick={cancelRequest} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"><X size={16} /> Cancel</button>
          : <button key="send" type="submit" disabled={!url.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"><Send size={16} /> Send request</button>}
      </form>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 px-4 pb-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
          <input type="checkbox" checked={useProxy} onChange={event => setUseProxy(event.target.checked)} className="h-4 w-4 accent-[var(--brand)]" /> Use MSYN proxy
        </label>
        <details className="max-w-xl text-xs leading-5 text-slate-500">
          <summary className="cursor-pointer">Connection &amp; storage details</summary>
          <p className="mt-2">Proxy requests pass through MSYN to public endpoints on ports 80 or 443. Direct requests are subject to browser CORS and local-network permissions. Timeout: 30 seconds. Response limit: 2 MB. Saved requests and history stay in this browser; bodies are retained, while authentication and custom header values are cleared.</p>
        </details>
      </div>
      {libraryError && <p role="alert" className="border-b border-red-200 bg-red-50 p-3 text-xs text-red-800">{libraryError}</p>}
      {storageNotice && <p role="status" className="border-b border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{storageNotice}</p>}

      <div className="min-w-0">
        <section aria-label="Request editor" className="min-w-0 border-b border-slate-200">
          <ClientTabs label="Request settings" value={activeReqTab} onChange={value => setActiveReqTab(value as typeof activeReqTab)} items={[
            { id: "params", label: "Parameters", count: params.filter(row => row.enabled && row.key).length },
            { id: "headers", label: "Headers", count: headers.filter(row => row.enabled && row.key).length },
            { id: "auth", label: "Authorization" }, { id: "body", label: "Body" }, { id: "code", label: "Code" },
          ]} />
          <div role="tabpanel" id={"request-settings-" + activeReqTab} aria-labelledby={"request-settings-tab-" + activeReqTab} className="min-h-52 p-4 sm:p-5">
            {activeReqTab === "params" && <RequestRows label="Parameter" rows={params} onChange={setParamsAndUrl} />}
            {activeReqTab === "headers" && <RequestRows label="Header" rows={headers} onChange={setHeaders} />}
            {activeReqTab === "auth" && <div className="space-y-4">
              <label className="block text-xs font-medium text-slate-700">Authorization type
                <select value={authType} onChange={event => setAuthType(event.target.value as typeof authType)} className={fieldClass + " mt-2"}>
                  <option value="none">No authorization</option><option value="bearer">Bearer token</option><option value="basic">Basic authentication</option><option value="apikey">API key</option>
                </select>
              </label>
              {authType === "none" && <p className="text-sm text-slate-500">No authorization header will be added.</p>}
              {authType === "bearer" && <label className="block text-xs font-medium text-slate-700">Bearer token<input type="password" autoComplete="off" value={bearerToken} onChange={event => setBearerToken(event.target.value)} placeholder="Enter token" className={fieldClass + " mt-2"} /></label>}
              {authType === "basic" && <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">Username<input autoComplete="off" value={basicUser} onChange={event => setBasicUser(event.target.value)} placeholder="Username" className={fieldClass + " mt-2"} /></label>
                <label className="block text-xs font-medium text-slate-700">Password<input type="password" autoComplete="off" value={basicPass} onChange={event => setBasicPass(event.target.value)} placeholder="Password" className={fieldClass + " mt-2"} /></label>
              </div>}
              {authType === "apikey" && <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-700">Key name<input value={apiKeyName} onChange={event => setApiKeyName(event.target.value)} placeholder="X-API-Key" className={fieldClass + " mt-2"} /></label>
                <label className="block text-xs font-medium text-slate-700">Key value<input type="password" autoComplete="off" value={apiKeyValue} onChange={event => setApiKeyValue(event.target.value)} placeholder="Enter API key" className={fieldClass + " mt-2"} /></label>
                <label className="block text-xs font-medium text-slate-700">Add key to<select value={apiKeyPlacement} onChange={event => setApiKeyPlacement(event.target.value as typeof apiKeyPlacement)} className={fieldClass + " mt-2"}><option value="header">Header</option><option value="query">Query parameters</option></select></label>
              </div>}
            </div>}
            {activeReqTab === "body" && <div className="space-y-4">
              <label className="block text-xs font-medium text-slate-700">Body format<select value={bodyType} onChange={event => { setBodyType(event.target.value as typeof bodyType); setJsonError(null); }} className={fieldClass + " mt-2"}><option value="none">No body</option><option value="json">JSON</option><option value="urlencoded">URL-encoded form</option><option value="raw">Plain text</option></select></label>
              {["GET", "HEAD"].includes(method) && bodyType !== "none" && <p className="text-xs text-amber-800">{method} requests do not send a body. Choose POST, PUT, PATCH or DELETE to include it.</p>}
              {bodyType === "json" && <div>
                <div className="mb-2 flex items-center justify-between"><label htmlFor="json-body" className="text-xs font-medium text-slate-700">JSON body</label><IconButton label="Format JSON" onClick={formatJson}><Braces size={16} /></IconButton></div>
                <textarea id="json-body" spellCheck={false} value={bodyJson} onChange={event => { setBodyJson(event.target.value); setJsonError(null); }} aria-invalid={!!jsonError} aria-describedby={jsonError ? "json-body-error" : undefined} rows={12} className={fieldClass + " resize-y font-mono leading-6"} />
                {jsonError && <p id="json-body-error" role="alert" className="mt-2 text-xs text-red-700">{jsonError}</p>}
              </div>}
              {bodyType === "raw" && <label className="block text-xs font-medium text-slate-700">Plain text body<textarea spellCheck={false} value={bodyRaw} onChange={event => setBodyRaw(event.target.value)} rows={12} placeholder="Enter request body" className={fieldClass + " mt-2 resize-y font-mono leading-6"} /></label>}
              {bodyType === "urlencoded" && <RequestRows label="Form field" rows={bodyFormData} onChange={setBodyFormData} />}
            </div>}
            {activeReqTab === "code" && <div className="space-y-4">
              <div className="flex items-end justify-between gap-3"><label className="min-w-0 flex-1 text-xs font-medium text-slate-700">Language<select value={codeLang} onChange={event => setCodeLang(event.target.value as typeof codeLang)} className={fieldClass + " mt-2"}><option value="curl">cURL</option><option value="js">JavaScript / Fetch</option><option value="node">Node.js / Axios</option><option value="python">Python / requests</option><option value="php">PHP / cURL</option><option value="go">Go</option></select></label>
                <IconButton label={codeCopied ? "Snippet copied" : "Copy code snippet"} onClick={async () => { if (await copyText(generatedCode)) { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); } }}>{codeCopied ? <Check size={16} /> : <Copy size={16} />}</IconButton>
              </div>
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100"><code>{generatedCode}</code></pre>
            </div>}
          </div>
        </section>

        <section aria-label="Response" aria-busy={loading} className="min-w-0">
          <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2">
            <h2 className="text-sm font-semibold text-slate-900">Response</h2>
            <div className="flex items-center gap-1">
              <IconButton label={respCopied ? "Response copied" : "Copy response"} disabled={!response} onClick={async () => { if (response && await copyText(response.data)) { setRespCopied(true); setTimeout(() => setRespCopied(false), 2000); } }}>{respCopied ? <Check size={16} /> : <Copy size={16} />}</IconButton>
              <IconButton label="Download response" disabled={!response} onClick={() => { if (response) downloadBlob(new Blob([response.data], { type: response.contentType }), "response." + (response.contentType.includes("json") ? "json" : "txt")); }}><Download size={16} /></IconButton>
            </div>
          </div>
          {loading ? <div role="status" className="flex min-h-80 items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw size={18} className="animate-spin text-[var(--brand)]" /> Waiting for response</div>
            : !response ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center"><Terminal size={25} className="text-slate-300" /><p className="text-sm text-slate-500">No response yet</p></div>
            : <>
              <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 px-4 py-3 font-mono text-xs">
                <span className={response.isError || response.status >= 400 ? "font-semibold text-red-700" : response.status < 300 ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{response.status > 0 ? response.status + " " : ""}{response.statusText}</span>
                <span className="inline-flex items-center gap-1 text-slate-500"><Clock size={13} />{response.durationMs} ms</span><span className="inline-flex items-center gap-1 text-slate-500"><HardDrive size={13} />{formatBytes(response.sizeBytes)}</span>
              </div>
              {response.isError ? <div role="alert" className="m-4 space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <div className="flex items-start gap-2"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p className="min-w-0 break-words">{response.data}</p></div>
                <p className="text-xs leading-5">{useProxy ? "Check the endpoint and try again. For a local API, turn off the MSYN proxy and allow direct browser access." : "Check the endpoint's CORS settings and browser permissions. For a public API, try the MSYN proxy."}</p>
              </div> : <>
                <ClientTabs label="Response format" value={activeRespTab} onChange={value => setActiveRespTab(value as typeof activeRespTab)} items={[{ id: "pretty", label: "Formatted" }, { id: "raw", label: "Raw" }, { id: "headers", label: "Headers", count: Object.keys(response.headers).length }, { id: "preview", label: "Preview" }]} />
                <div role="tabpanel" id={"response-format-" + activeRespTab} aria-labelledby={"response-format-tab-" + activeRespTab} className="min-h-72 p-4">
                  {activeRespTab === "headers" ? <dl className="divide-y divide-slate-200">{Object.entries(response.headers).map(([key, value]) => <div key={key} className="grid min-w-0 gap-1 py-3 font-mono text-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-3"><dt className="break-all font-semibold text-slate-700">{key}</dt><dd className="break-all text-slate-500">{value}</dd></div>)}</dl>
                    : activeRespTab === "preview" ? <iframe title="Response preview" srcDoc={response.contentType.includes("html") ? response.data : "<pre>" + escapeHtml(response.data) + "</pre>"} sandbox="" referrerPolicy="no-referrer" className="h-96 w-full rounded-md border border-slate-200" />
                    : <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-700">{response.data ? activeRespTab === "pretty" ? formattedResponseJson : response.data : "(empty response body)"}</pre>}
                </div>
              </>}
            </>}
        </section>
      </div>

          </div>
        </section>
      </div>

      <dialog ref={collectionDialog} onCancel={() => setCollectionModalOpen(false)} onClose={() => setCollectionModalOpen(false)} aria-labelledby="collection-dialog-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-black/40">
        <form onSubmit={event => { event.preventDefault(); saveCollection(); }}>
          <div className="flex items-center justify-between"><h2 id="collection-dialog-title" className="text-lg font-semibold text-slate-900">{editingCollection ? "Rename collection" : "New collection"}</h2><IconButton label="Close collection dialog" onClick={() => setCollectionModalOpen(false)}><X size={17} /></IconButton></div>
          <label className="mt-5 block text-sm font-medium text-slate-700">Collection name<input autoFocus required maxLength={100} value={collectionName} onChange={event => setCollectionName(event.target.value)} placeholder="e.g. Inventory API" className={fieldClass + " mt-2"} /></label>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCollectionModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={!collectionName.trim()} className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">{editingCollection ? "Save changes" : "Create collection"}</button></div>
        </form>
      </dialog>
      <dialog ref={saveDialog} onCancel={() => setSaveModalOpen(false)} onClose={() => setSaveModalOpen(false)} aria-labelledby="save-request-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-black/40">
        <form onSubmit={event => { event.preventDefault(); const destination = new FormData(event.currentTarget).get("collection"); handleSaveCollection(typeof destination === "string" ? destination : collectionId); }}>
          <div className="flex items-center justify-between gap-3"><h2 id="save-request-title" className="text-lg font-semibold">Save request</h2><IconButton label="Close save dialog" onClick={() => setSaveModalOpen(false)}><X size={18} /></IconButton></div>
          <label className="mt-5 block text-sm font-medium">Request name<input autoFocus required maxLength={100} value={saveName} onChange={event => setSaveName(event.target.value)} placeholder="e.g. Inventory / list products" className={fieldClass + " mt-2"} /></label>
          <label className="mt-4 block text-sm font-medium">Collection<select name="collection" aria-label="Save to collection" defaultValue={collectionId} className={fieldClass + " mt-2"}>{collections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <p className="mt-3 text-xs leading-5 text-slate-500">Saved in this browser. Authentication and custom header values are removed; request bodies are retained.</p>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setSaveModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={!saveName.trim()} className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">Save request</button></div>
        </form>
      </dialog>
      {collectionMenu && createPortal(
        <div ref={collectionMenuRef} role="menu" aria-label={"Collection actions for " + collectionMenu.collection.name} style={{ left: collectionMenu.left, top: collectionMenu.top }} className="fixed z-[70] w-[200px] rounded-md border border-slate-200 bg-white p-1 shadow-lg" onKeyDown={event => {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); buttons[(index + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length]?.focus(); }
        }}>
          <button type="button" role="menuitem" onClick={() => { setEditingCollection(collectionMenu.collection.id); setCollectionName(collectionMenu.collection.name); setCollectionModalOpen(true); setCollectionMenu(null); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 focus:bg-slate-100"><Pencil size={13} />Rename collection</button>
          <button type="button" role="menuitem" onClick={() => { exportCollection(collectionMenu.collection); setCollectionMenu(null); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 focus:bg-slate-100"><Download size={13} />Export collection</button>
          {collectionMenu.collection.id !== DEFAULT_COLLECTION.id && <button type="button" role="menuitem" onClick={() => { removeCollection(collectionMenu.collection.id); setCollectionMenu(null); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 focus:bg-red-50"><Trash2 size={13} />Remove collection</button>}
        </div>, document.body)}
    </div>
  );
}

const fieldClass = "w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]";
function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function IconButton({ label, children, onClick, disabled = false }: { label: string; children: React.ReactNode; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; disabled?: boolean }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] disabled:opacity-30">{children}</button>;
}
function ClientTabs({ label, value, items, onChange }: { label: string; value: string; items: { id: string; label: string; count?: number }[]; onChange: (value: string) => void }) {
  const prefix = label.toLowerCase().replace(/ /g, "-");
  return <div role="tablist" aria-label={label} className="flex min-h-12 overflow-x-auto border-b border-slate-200 px-2" onKeyDown={event => {
    const index = items.findIndex(item => item.id === value);
    const next = event.key === "ArrowRight" ? (index + 1) % items.length : event.key === "ArrowLeft" ? (index + items.length - 1) % items.length : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
    if (next >= 0) { event.preventDefault(); onChange(items[next].id); event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus(); }
  }}>{items.map(item => <button type="button" role="tab" id={prefix + "-tab-" + item.id} aria-controls={prefix + "-" + item.id} aria-selected={value === item.id} tabIndex={value === item.id ? 0 : -1} key={item.id} onClick={() => onChange(item.id)} className={"shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium " + (value === item.id ? "border-[var(--brand)] text-violet-800" : "border-transparent text-slate-500 hover:text-slate-900")}>{item.label}{!!item.count && <span className="ml-1.5 text-slate-400">{item.count}</span>}</button>)}</div>;
}
function RequestRows({ label, rows, onChange }: { label: string; rows: KeyValuePair[]; onChange: (rows: KeyValuePair[]) => void }) {
  const update = (id: string, field: "key" | "value" | "enabled", value: string | boolean) => onChange(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  return <div className="space-y-3">
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-2 text-xs font-medium text-slate-500"><span /><span>Name</span><span>Value</span><span /></div>
    {rows.map((row, index) => <div key={row.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-2">
      <input type="checkbox" aria-label={label + " " + (index + 1) + " enabled"} checked={row.enabled} onChange={event => update(row.id, "enabled", event.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
      <input aria-label={label + " " + (index + 1) + " name"} value={row.key} onChange={event => update(row.id, "key", event.target.value)} placeholder="Name" spellCheck={false} className={fieldClass + " font-mono text-xs"} />
      <input aria-label={label + " " + (index + 1) + " value"} value={row.value} onChange={event => update(row.id, "value", event.target.value)} placeholder="Value" spellCheck={false} className={fieldClass + " font-mono text-xs"} />
      <IconButton label={"Remove " + label.toLowerCase() + " " + (index + 1)} onClick={() => onChange(rows.filter(item => item.id !== row.id))}><Trash2 size={15} /></IconButton>
    </div>)}
    <button type="button" onClick={() => onChange([...rows, { id: crypto.randomUUID(), key: "", value: "", enabled: true }])} className="inline-flex items-center gap-2 py-2 text-xs font-semibold text-[var(--brand)] hover:text-violet-800"><Plus size={15} />Add {label.toLowerCase()}</button>
  </div>;
}
