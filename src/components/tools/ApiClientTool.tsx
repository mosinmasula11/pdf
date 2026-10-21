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
import { DEFAULT_COLLECTION, apiHistoryKey, deduplicateApiHistory, recordApiHistory, exportApiCollection, importApiCollection, normalizeCollections } from "@/lib/api-workspace";
import type { ApiCollection } from "@/lib/api-workspace";
import { apiParams, apiSnippet, API_TIMEOUT_MS, compileApiRequest, sanitizeApiRequest } from "@/lib/api-request";
import { apiDestinationKind } from "@/lib/api-local";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

interface SavedRequest {
  createdAt?: number;
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
interface OpenRequestTab {
  sourceId?: string; id: string; name: string; request: SavedRequest | null; response: ApiResponse | null; savedId: string | null
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
  const [method, setMethod] = useState < HttpMethod > ("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const destinationKind = apiDestinationKind(url);
  const effectiveProxy = destinationKind === "public";

  // Tabs for Request Editor
  const [activeReqTab, setActiveReqTab] = useState < "params" | "headers" | "auth" | "body" | "code" > ("params");
  const supportsBody = !["GET", "HEAD"].includes(method);
  const visibleReqTab = activeReqTab === "body" && !supportsBody ? "params" : activeReqTab;

  // Query Params
  const [params, setParams] = useState < KeyValuePair[] > ([
    { id: "1", key: "_limit", value: "5", enabled: true },
  ]);

  // Headers
  const [headers, setHeaders] = useState < KeyValuePair[] > ([
    { id: "1", key: "Accept", value: "application/json", enabled: true },
  ]);

  // Authentication
  const [authType, setAuthType] = useState < "none" | "bearer" | "basic" | "apikey" > ("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [apiKeyName, setApiKeyName] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyPlacement, setApiKeyPlacement] = useState < "header" | "query" > ("header");

  // Body
  const [bodyType, setBodyType] = useState < "none" | "json" | "form-data" | "urlencoded" | "raw" > ("none");
  const [bodyJson, setBodyJson] = useState('{\n  "name": "Alex",\n  "role": "Developer"\n}');
  const [bodyFormData, setBodyFormData] = useState < KeyValuePair[] > ([
    { id: "1", key: "key", value: "value", enabled: true },
  ]);
  const [bodyRaw, setBodyRaw] = useState("");
  const [jsonError, setJsonError] = useState < string | null > (null);

  // Response State
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState < ApiResponse | null > (null);

  // Response Viewer Tabs
  const [activeRespTab, setActiveRespTab] = useState < "pretty" | "raw" | "preview" | "headers" > ("pretty");
  const [respCopied, setRespCopied] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const requestController = useRef < AbortController | null > (null);
  const requestStartedAt = useRef(0);

  // Code Snippet Target Language
  const [codeLang, setCodeLang] = useState < "curl" | "js" | "node" | "python" | "php" | "go" > ("curl");
  const [codeCopied, setCodeCopied] = useState(false);

  // History & Collections
  const [history, setHistory] = useState < SavedRequest[] > ([]);
  const [savedRequests, setSavedRequests] = useState < SavedRequest[] > ([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collections, setCollections] = useState < ApiCollection[] > ([DEFAULT_COLLECTION]);
  const [collectionId, setCollectionId] = useState(DEFAULT_COLLECTION.id);

  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [collectionMenu, setCollectionMenu] = useState < { collection: ApiCollection; left: number; top: number } | null > (null);
  const [requestMenu, setRequestMenu] = useState < { request: SavedRequest; recent: boolean; left: number; top: number } | null > (null);
  const requestMenuRef = useRef < HTMLDivElement > (null);
  const [dropTarget, setDropTarget] = useState < string | null > (null);
  useEffect(() => {
    if (!requestMenu) return;
    requestMenuRef.current?.querySelector < HTMLButtonElement > ('button')?.focus();
    const outside = (event: PointerEvent) => { if (!requestMenuRef.current?.contains(event.target as Node)) setRequestMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setRequestMenu(null); };
    const close = () => setRequestMenu(null);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); };
  }, [requestMenu]);
  const [tabMenu, setTabMenu] = useState < { id: string; left: number; top: number } | null > (null);
  const tabMenuRef = useRef < HTMLDivElement > (null);
  useEffect(() => {
    if (!tabMenu) return;
    tabMenuRef.current?.querySelector < HTMLButtonElement > ('button')?.focus();
    const outside = (event: PointerEvent) => { if (!tabMenuRef.current?.contains(event.target as Node)) setTabMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setTabMenu(null); };
    const close = () => setTabMenu(null);
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape); window.addEventListener('scroll', close, true); window.addEventListener('resize', close);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [tabMenu]);
  const collectionMenuRef = useRef < HTMLDivElement > (null);
  const collectionMenuTrigger = useRef < HTMLButtonElement > (null);
  const [collapsedCollections, setCollapsedCollections] = useState < Record < string, boolean>> ({});
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [editingCollection, setEditingCollection] = useState < string | null > (null);
  const [openTabs, setOpenTabs] = useState < OpenRequestTab[] > ([{ id: "initial", name: "Untitled request", request: null, response: null, savedId: null }]);
  const [activeTabId, setActiveTabId] = useState("initial");
  const [draftName, setDraftName] = useState("Untitled request");
  const [activeSavedId, setActiveSavedId] = useState < string | null > (null);
  const collectionDialog = useRef < HTMLDialogElement > (null);
  const collectionFile = useRef < HTMLInputElement > (null);
  const saveDialog = useRef < HTMLDialogElement > (null);
  useEffect(() => {
    if (!collectionMenu) return;
    collectionMenuRef.current?.querySelector < HTMLButtonElement > ("button")?.focus();
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
    if (collectionModalOpen) { collectionDialog.current?.showModal(); collectionDialog.current?.querySelector < HTMLInputElement > ("input")?.focus(); }
    else collectionDialog.current?.close();
  }, [collectionModalOpen]);
  useEffect(() => {
    if (saveModalOpen) {
      saveDialog.current?.showModal();
      const destination = saveDialog.current?.querySelector < HTMLSelectElement > ('select[name="collection"]');
      if (destination) destination.value = collectionId;
      saveDialog.current?.querySelector < HTMLInputElement > ("input")?.focus();
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
          const migrated = key === "msyn_api_client_history" ? deduplicateApiHistory(items) : items;
          setter(migrated);
          localStorage.setItem(key, JSON.stringify(migrated));
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
    } catch { }
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

  const currentConfig = () => ({
    method, url, headers, authType, bearerToken, basicUser, basicPass,
    apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData
  });

  const cancelRequest = () => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
    setResponse({
      status: 0, statusText: "Request stopped", durationMs: Math.round(performance.now() - requestStartedAt.current),
      sizeBytes: 0, headers: {}, data: "Request cancelled.", contentType: "text/plain", isError: true
    });
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
      const histItem = sanitizeApiRequest({
        ...currentConfig(), params, id: crypto.randomUUID(),
        name: draftName === "Untitled request" ? method + " request" : draftName, timestamp: Date.now()
      });
      setHistory(previous => {
        const updated = recordApiHistory(previous, histItem);
        persistRequests("msyn_api_client_history", updated);
        return updated;
      });
      let json!: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        data: string;
        contentType: string;
        durationMs: number;
        sizeBytes: number;
        isError?: boolean;
        error?: string;
      };

      if (!effectiveProxy) {
        // Direct browser fetch: Connects directly from the user's browser to their local server / computer!
        try {
          const fetchHeaders = new Headers(compiled.headers);
          const hasBody = !["GET", "HEAD"].includes(compiled.method) && compiled.body !== null;

          const directRes = await fetch(compiled.url, {
            method: compiled.method,
            headers: fetchHeaders,
            body: hasBody ? compiled.body : undefined,
            signal,
            mode: "cors",
            credentials: "omit",
          });

          const rawText = await directRes.text();
          const resHeaders: Record<string, string> = {};
          directRes.headers.forEach((val, key) => {
            resHeaders[key] = val;
          });

          const durationMs = Math.round(performance.now() - startTime);
          const sizeBytes = new TextEncoder().encode(rawText).length;

          json = {
            status: directRes.status,
            statusText: directRes.statusText || (directRes.ok ? "OK" : "Error"),
            headers: resHeaders,
            data: rawText,
            contentType: directRes.headers.get("content-type") || "text/plain",
            durationMs,
            sizeBytes,
            isError: !directRes.ok,
          };
        } catch (directErr) {
          // If in local development and Next.js /api/local-request proxy is available, try as fallback
          let devHandled = false;
          if (typeof window !== "undefined" && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
            try {
              const res = await fetch("/api/local-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(compiled),
                signal,
              });
              if (res.ok) {
                const devJson = await res.json();
                if (typeof devJson.data === "string" && devJson.headers && typeof devJson.status === "number") {
                  json = { ...devJson, isError: devJson.isError || (!res.ok && devJson.status === 0) };
                  devHandled = true;
                }
              }
            } catch {
              // ignore and provide clear direct advice
            }
          }

          if (!devHandled) {
            if (requestController.current !== controller) return;
            const durationMs = Math.round(performance.now() - startTime);
            const host = (() => {
              try { return new URL(compiled.url).host; } catch { return "localhost"; }
            })();

            const advice = `Could not connect to ${compiled.url} directly from your browser.\n\nTroubleshooting tips:\n1. Verify your local server is actively running on ${host}.\n2. Ensure CORS is enabled on your local API server:\n   • FastAPI / Python: Add CORSMiddleware with allow_origins=["*"]\n   • Node / Express: app.use(cors())\n   • Flask: CORS(app)\n3. Check your browser DevTools Console (F12) for network, CORS, or security details.\n4. You can also copy the cURL command from the 'Code' tab to run it directly from your terminal.`;

            json = {
              status: 0,
              statusText: "Connection Failed",
              headers: {},
              data: advice,
              contentType: "text/plain",
              durationMs,
              sizeBytes: 0,
              isError: true,
            };
          }
        }
      } else {
        const res = await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(compiled),
          signal,
        });
        const resJson = await res.json();
        if (requestController.current !== controller) return;
        if (typeof resJson.data !== "string" || !resJson.headers || typeof resJson.status !== "number") {
          throw new Error(resJson.error || "The server returned an invalid response.");
        }
        json = { ...resJson, isError: resJson.isError || (!res.ok && resJson.status === 0) };
      }

      if (requestController.current !== controller) return;
      setResponse(json);
    } catch (error: unknown) {
      if (requestController.current !== controller) return;
      if (error instanceof SyntaxError && bodyType === "json") { setJsonError("Enter a valid JSON request body."); setActiveReqTab("body"); }
      const message = signal.aborted ? (controller.signal.aborted ? "Request cancelled." : "Request timed out after 30 seconds.")
        : error instanceof Error ? error.message : "Request failed.";
      setResponse({
        status: 0, statusText: signal.aborted ? "Request stopped" : "Request Error", durationMs: Math.round(performance.now() - startTime),
        sizeBytes: 0, headers: {}, data: message, contentType: "text/plain", isError: true
      });
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
      createdAt: savedRequests.find(item => item.id === activeSavedId)?.createdAt ?? savedRequests.find(item => item.id === activeSavedId)?.timestamp ?? Date.now(),
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
    const updated = savedRequests.some(item => item.id === newItem.id) ? savedRequests.map(item => item.id === newItem.id ? newItem : item) : [...savedRequests, newItem];
    setDraftName(newItem.name); setActiveSavedId(newItem.id); setCollectionId(destination);
    setSavedRequests(updated);
    persistRequests("msyn_api_client_saved", updated);
    setSaveModalOpen(false);
    setSaveName("");
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
      const updated = [...savedRequests, ...requests]; setSavedRequests(updated); persistRequests("msyn_api_client_saved", updated);
      setLibrarySearch(""); setStorageNotice("Imported " + requests.length + " requests. Re-enter authentication values before sending.");
    } catch (error) { setLibraryError(error instanceof Error ? error.message : "Collection import failed."); }
    if (collectionFile.current) collectionFile.current.value = "";
  };
  const draftRequest = (): SavedRequest => ({ ...currentConfig(), params, id: activeSavedId || activeTabId, name: draftName, collectionId, timestamp: Date.now() });
  const checkpointTabs = () => {
    const stopped = requestController.current ? {
      status: 0, statusText: "Request stopped", durationMs: Math.round(performance.now() - requestStartedAt.current),
      sizeBytes: 0, headers: {}, data: "Request cancelled.", contentType: "text/plain", isError: true
    } : response;
    if (requestController.current) cancelRequest();
    return openTabs.map(tab => tab.id === activeTabId ? { ...tab, name: draftName, request: draftRequest(), response: stopped, savedId: activeSavedId } : tab);
  };
  const selectRequestTab = (id: string) => {
    if (id === activeTabId) return;
    const tabs = checkpointTabs(), tab = tabs.find(item => item.id === id);
    if (!tab) return;
    setOpenTabs(tabs); setActiveTabId(id); setDraftName(tab.name); setActiveSavedId(tab.savedId);
    if (tab.request) { restoreRequest(tab.request); setCollectionId(tab.request.collectionId || DEFAULT_COLLECTION.id); }
    setResponse(tab.response); setJsonError(null);
  };
  const openRequest = (request?: SavedRequest, saved = false, targetCollection = DEFAULT_COLLECTION.id) => {
    const existing = request ? openTabs.find(tab => tab.sourceId === request.id || tab.savedId === request.id || tab.request?.id === request.id || (tab.id === activeTabId && activeSavedId === request.id)) : undefined;
    if (existing) { selectRequestTab(existing.id); return; }
    const tabs = checkpointTabs(), id = crypto.randomUUID();
    const next: SavedRequest = request || {
      method: "GET", url: "", params: [], headers: [{ id: crypto.randomUUID(), key: "Accept", value: "application/json", enabled: true }],
      authType: "none", bearerToken: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyPlacement: "header",
      bodyType: "none", bodyRaw: "", bodyJson: "", bodyFormData: [], id, name: "Untitled request", timestamp: Date.now(), collectionId: targetCollection,
    };
    const tab: OpenRequestTab = { id, sourceId: request?.id, name: next.name, request: next, response: null, savedId: saved ? next.id : null };
    setOpenTabs([...tabs, tab]); setActiveTabId(id); setDraftName(next.name); setActiveSavedId(tab.savedId);
    restoreRequest(next); setCollectionId(next.collectionId || DEFAULT_COLLECTION.id); setResponse(null);
  };
  const closeRequestTab = (id: string) => {
    if (id !== activeTabId) { setOpenTabs(tabs => tabs.filter(tab => tab.id !== id)); return; }
    const tabs = checkpointTabs().filter(tab => tab.id !== id);
    if (!tabs.length) {
      const empty: SavedRequest = {
        ...draftRequest(), id: crypto.randomUUID(), name: "Untitled request", url: "", method: "GET", params: [], headers: [], authType: "none",
        bearerToken: "", basicUser: "", basicPass: "", apiKeyValue: "", bodyType: "none", bodyRaw: "", bodyJson: "", bodyFormData: []
      };
      restoreRequest(empty); setActiveSavedId(null); setDraftName(empty.name); setResponse(null);
      const tab: OpenRequestTab = { id: empty.id, name: empty.name, request: empty, response: null, savedId: null };
      setOpenTabs([tab]); setActiveTabId(tab.id); return;
    }
    setOpenTabs(tabs);
    if (id === activeTabId) {
      const tab = tabs[tabs.length - 1]; setActiveTabId(tab.id); setDraftName(tab.name); setActiveSavedId(tab.savedId); setResponse(tab.response);
      if (tab.request) { restoreRequest(tab.request); setCollectionId(tab.request.collectionId || DEFAULT_COLLECTION.id); }
    }
  };
  const closeRequestTabs = (target: string, mode: 'all' | 'others' | 'right' | 'left') => {
    const tabs = checkpointTabs();
    const index = tabs.findIndex(tab => tab.id === target);
    const remaining = tabs.filter((tab, position) => mode === 'all' ? false : mode === 'others' ? tab.id === target : mode === 'right' ? position <= index : position >= index);
    setTabMenu(null);
    if (!remaining.length) {
      const id = crypto.randomUUID();
      const empty: SavedRequest = { ...draftRequest(), id, name: 'Untitled request', url: '', method: 'GET', params: [], headers: [], authType: 'none', bearerToken: '', basicUser: '', basicPass: '', apiKeyValue: '', bodyType: 'none', bodyRaw: '', bodyJson: '', bodyFormData: [], collectionId: DEFAULT_COLLECTION.id };
      setOpenTabs([{ id, name: empty.name, request: empty, response: null, savedId: null }]); setActiveTabId(id); restoreRequest(empty); setCollectionId(DEFAULT_COLLECTION.id); setActiveSavedId(null); setDraftName(empty.name); setResponse(null); setJsonError(null); return;
    }
    const next = remaining.find(tab => tab.id === activeTabId) || remaining.find(tab => tab.id === target) || remaining[remaining.length - 1];
    setOpenTabs(remaining); setActiveTabId(next.id); setDraftName(next.name); setActiveSavedId(next.savedId); setResponse(next.response); setJsonError(null);
    if (next.request) { restoreRequest(next.request); setCollectionId(next.request.collectionId || DEFAULT_COLLECTION.id); }
  };
  const matchingRequest = (item: SavedRequest) => (item.name + " " + item.url + " " + item.method).toLowerCase().includes(librarySearch.toLowerCase());


  const moveRequest = (request: SavedRequest, recent: boolean, destination: string) => {
    if (!collections.some(item => item.id === destination)) return;
    const moved = sanitizeApiRequest({ ...request, collectionId: destination });
    const next = savedRequests.some(item => item.id === request.id) ? savedRequests.map(item => item.id === request.id ? moved : item) : [...savedRequests, moved];
    setSavedRequests(next); persistRequests('msyn_api_client_saved', next);
    if (recent) { const nextHistory = history.filter(item => item.id !== request.id); setHistory(nextHistory); persistRequests('msyn_api_client_history', nextHistory); }
    setOpenTabs(tabs => tabs.map(tab => tab.request?.id === request.id ? { ...tab, request: { ...tab.request, collectionId: destination }, savedId: request.id } : tab));
    if (activeSavedId === request.id || openTabs.find(tab => tab.id === activeTabId)?.request?.id === request.id) { setCollectionId(destination); setActiveSavedId(request.id); }
    setCollapsedCollections(previous => ({ ...previous, [destination]: false }));
    setRequestMenu(null); setDropTarget(null);
  };
  const deleteRequest = (request: SavedRequest, recent: boolean) => {
    const next = (recent ? history : savedRequests).filter(item => item.id !== request.id);
    if (recent) setHistory(next); else { setSavedRequests(next); if (activeSavedId === request.id) setActiveSavedId(null); }
    persistRequests(recent ? 'msyn_api_client_history' : 'msyn_api_client_saved', next); setRequestMenu(null);
  };
  const showRequestMenu = (request: SavedRequest, recent: boolean, x: number, y: number) => {
    setCollectionMenu(null);
    setRequestMenu({ request, recent, left: Math.max(8, Math.min(x, window.innerWidth - 248)), top: Math.max(8, Math.min(y, window.innerHeight - 300)) });
  };
  const renameRequest = (request: SavedRequest, recent: boolean, name: string) => {
    const trimmed = name.trim(); if (!trimmed) return;
    const items = (recent ? history : savedRequests).map(item => item.id === request.id ? { ...item, name: trimmed } : item);
    if (recent) setHistory(items); else setSavedRequests(items);
    persistRequests(recent ? 'msyn_api_client_history' : 'msyn_api_client_saved', items);
    setOpenTabs(tabs => tabs.map(tab => tab.sourceId === request.id || tab.savedId === request.id || tab.request?.id === request.id ? { ...tab, name: trimmed, request: tab.request ? { ...tab.request, name: trimmed } : null } : tab));
    if (activeSavedId === request.id || openTabs.find(tab => tab.id === activeTabId)?.sourceId === request.id) setDraftName(trimmed);
  };
  const commitDraftName = () => {
    const sourceId = activeSavedId || openTabs.find(tab => tab.id === activeTabId)?.sourceId;
    const saved = savedRequests.find(item => item.id === sourceId);
    const item = saved || history.find(entry => entry.id === sourceId);
    if (item) renameRequest(item, !saved, draftName);
    else setDraftName(draftName.trim() || 'Untitled request');
  };
  const normalRequests = [...savedRequests.filter(item => !item.collectionId || item.collectionId === DEFAULT_COLLECTION.id), ...history.filter(item => !savedRequests.some(saved => saved.id === item.id || apiHistoryKey(saved) === apiHistoryKey(item)))].filter(matchingRequest).sort((a, b) => (a.createdAt ?? a.timestamp) - (b.createdAt ?? b.timestamp));

  const generatedCode = useMemo(() => {
    try {
      return apiSnippet({
        method, url, headers, authType, bearerToken, basicUser, basicPass,
        apiKeyName, apiKeyValue, apiKeyPlacement, bodyType, bodyJson, bodyRaw, bodyFormData
      }, codeLang);
    }
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
        <aside id="request-library" aria-label="Requests and collections" className={(sidebarOpen ? "flex" : "hidden lg:flex") + " w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50 lg:w-72 lg:border-r lg:border-b-0"}>
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3"><h3 className="text-xs font-semibold text-slate-700">Requests</h3><div className="flex gap-1"><IconButton label="New collection" onClick={() => { setEditingCollection(null); setCollectionName(''); setCollectionModalOpen(true); }}><Folder size={15} /></IconButton><IconButton label="Clear request history" onClick={clearHistory} disabled={!history.length}><Trash2 size={15} /></IconButton></div></div>
          <div className="px-2 py-2"><label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-slate-400"><Search size={14} /><input type="search" aria-label="Search requests and collections" value={librarySearch} onChange={event => setLibrarySearch(event.target.value)} placeholder="Search" className="h-8 min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none" /></label></div>
          <div className="max-h-80 min-w-0 overflow-y-auto px-1 py-2 lg:max-h-[900px]">
            {collections.filter(item => item.id !== DEFAULT_COLLECTION.id).map(item => {
              const requests = savedRequests.filter(request => request.collectionId === item.id && (item.name.toLowerCase().includes(librarySearch.toLowerCase()) || matchingRequest(request))).sort((a, b) => (a.createdAt ?? a.timestamp) - (b.createdAt ?? b.timestamp));
              if (librarySearch && !requests.length && !item.name.toLowerCase().includes(librarySearch.toLowerCase())) return null;
              return <div key={item.id} data-collection-drop={item.id} onContextMenu={event => { event.preventDefault(); if ((event.target as HTMLElement).closest('[draggable]')) return; setRequestMenu(null); setCollectionMenu({ collection: item, left: Math.max(8, Math.min(event.clientX, window.innerWidth - 208)), top: Math.max(8, Math.min(event.clientY, window.innerHeight - 160)) }); }}
                onDragOver={event => { if (event.dataTransfer.types.includes('application/x-msyn-request')) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTarget(item.id); } }}
                onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }}
                onDrop={event => { event.preventDefault(); event.stopPropagation(); try { const data = JSON.parse(event.dataTransfer.getData('application/x-msyn-request')); const request = (data.recent ? history : savedRequests).find(entry => entry.id === data.id); if (request) moveRequest(request, !!data.recent, item.id); } catch { setDropTarget(null); } }} className={'mb-1 rounded ' + (dropTarget === item.id ? 'bg-violet-100 ring-2 ring-violet-400' : '')}>
                <div className="flex items-center px-1"><button type="button" aria-expanded={!collapsedCollections[item.id]} onClick={() => setCollapsedCollections(previous => ({ ...previous, [item.id]: !previous[item.id] }))} className="flex min-w-0 flex-1 items-center gap-1.5 px-1 py-2 text-left text-xs font-semibold text-slate-700">{collapsedCollections[item.id] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}<Folder size={15} /><span className="truncate">{item.name}</span><span className="text-slate-400">{requests.length}</span></button><IconButton label={'Add request to ' + item.name} onClick={() => openRequest(undefined, false, item.id)}><Plus size={14} /></IconButton><button type="button" aria-label={'Actions for ' + item.name} aria-haspopup="menu" onClick={event => { const bounds = event.currentTarget.getBoundingClientRect(); collectionMenuTrigger.current = event.currentTarget; setRequestMenu(null); setCollectionMenu({ collection: item, left: Math.max(8, Math.min(bounds.left, window.innerWidth - 208)), top: Math.max(8, Math.min(bounds.bottom, window.innerHeight - 160)) }); }} className="rounded p-2 text-slate-500"><MoreHorizontal size={15} /></button></div>
                {!collapsedCollections[item.id] && <div className="ml-4 border-l border-slate-200">{requests.map(request => <LibraryRequestRow key={request.id} request={request} recent={false} onRename={name => renameRequest(request, false, name)} active={activeSavedId === request.id} onOpen={() => openRequest(request, true)} onMenu={(x, y) => showRequestMenu(request, false, x, y)} onMove={destination => moveRequest(request, false, destination)} onDropTarget={id => { setDropTarget(id); setRequestMenu(null); }} />)}{!requests.length && <p className="px-3 py-2 text-xs text-slate-400">No requests</p>}</div>}
              </div>;
            })}
            <div data-collection-drop={DEFAULT_COLLECTION.id} onDragOver={event => { if (event.dataTransfer.types.includes('application/x-msyn-request')) { event.preventDefault(); setDropTarget(DEFAULT_COLLECTION.id); } }} onDrop={event => { event.preventDefault(); try { const data = JSON.parse(event.dataTransfer.getData('application/x-msyn-request')); const request = (data.recent ? history : savedRequests).find(entry => entry.id === data.id); if (request) moveRequest(request, !!data.recent, DEFAULT_COLLECTION.id); } catch { setDropTarget(null); } }} className={'min-h-16 rounded ' + (dropTarget === DEFAULT_COLLECTION.id ? 'bg-violet-100 ring-2 ring-violet-400' : '')}>
              {normalRequests.map(request => <LibraryRequestRow key={request.id} request={request} recent={!savedRequests.some(item => item.id === request.id)} onRename={name => renameRequest(request, !savedRequests.some(item => item.id === request.id), name)} active={activeSavedId === request.id} onOpen={() => openRequest(request, savedRequests.some(item => item.id === request.id))} onMenu={(x, y) => showRequestMenu(request, !savedRequests.some(item => item.id === request.id), x, y)} onMove={destination => moveRequest(request, !savedRequests.some(item => item.id === request.id), destination)} onDropTarget={id => { setDropTarget(id); setRequestMenu(null); }} />)}
              {!normalRequests.length && <p className="px-3 py-4 text-xs text-slate-400">{librarySearch ? 'No matching requests' : 'No unfiled requests'}</p>}
            </div>
          </div>
          <p className="mt-auto border-t border-slate-200 px-3 py-3 text-[10px] text-slate-400">Saved on this browser</p>
        </aside>

        <section className="min-w-0 flex-1" aria-label="API request workbench">
          <div className="flex items-stretch border-b border-slate-200 bg-slate-50">
            <div onContextMenu={event => { event.preventDefault(); setRequestMenu(null); setCollectionMenu(null); setTabMenu({ id: activeTabId, left: Math.max(8, Math.min(event.clientX, window.innerWidth - 228)), top: Math.max(8, Math.min(event.clientY, window.innerHeight - 280)) }); }} role="tablist" aria-label="Open requests" className="flex min-w-0 flex-1 overflow-x-auto" onKeyDown={event => {
              const index = openTabs.findIndex(tab => tab.id === activeTabId);
              const next = event.key === "ArrowRight" ? (index + 1) % openTabs.length : event.key === "ArrowLeft" ? (index + openTabs.length - 1) % openTabs.length : event.key === "Home" ? 0 : event.key === "End" ? openTabs.length - 1 : -1;
              if (next >= 0) { event.preventDefault(); selectRequestTab(openTabs[next].id); event.currentTarget.querySelectorAll < HTMLButtonElement > ('[role="tab"]')[next]?.focus(); }
            }}>
              {openTabs.map(tab => <div onContextMenu={event => { event.preventDefault(); event.stopPropagation(); setRequestMenu(null); setCollectionMenu(null); setTabMenu({ id: tab.id, left: Math.max(8, Math.min(event.clientX, window.innerWidth - 228)), top: Math.max(8, Math.min(event.clientY, window.innerHeight - 280)) }); }} key={tab.id} className={"flex max-w-64 min-w-36 shrink-0 items-center border-r border-slate-200 border-t-2 " + (tab.id === activeTabId ? "border-t-[var(--brand)] bg-white" : "border-t-transparent")}>
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
              <div className="min-w-0 break-words text-xs text-slate-500"><span>{collections.find(item => item.id === collectionId)?.id === DEFAULT_COLLECTION.id ? "Unfiled requests" : collections.find(item => item.id === collectionId)?.name || "Unfiled requests"}</span><span className="mx-2">/</span><input aria-label="Request name" value={draftName} onChange={event => setDraftName(event.target.value)} onBlur={commitDraftName} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} placeholder="Request name" className="min-w-24 max-w-64 rounded border border-transparent bg-transparent px-1 py-1 font-semibold text-slate-800 hover:border-slate-300 focus:border-violet-500 focus:outline-none" /></div>
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
            {!effectiveProxy && (
              <div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-850">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>Direct Mode Active:</strong> Connecting directly from your browser to your local server ({url.includes("localhost") || url.includes("127.0.0.1") ? "localhost" : "local network"}).</span>
              </div>
            )}
            {libraryError && <p role="alert" className="border-b border-red-200 bg-red-50 p-3 text-xs text-red-800">{libraryError}</p>}
            {storageNotice && <p role="status" className="border-b border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{storageNotice}</p>}

            <div className="min-w-0">
              <section aria-label="Request editor" className="min-w-0 border-b border-slate-200">
                <ClientTabs label="Request settings" value={visibleReqTab} onChange={value => { setActiveReqTab(value as typeof activeReqTab); if (value === "body" && bodyType === "none") setBodyType("json"); }} items={[
                  { id: "params", label: "Parameters", count: params.filter(row => row.enabled && row.key).length },
                  { id: "headers", label: "Headers", count: headers.filter(row => row.enabled && row.key).length },
                  { id: "auth", label: "Authorization" }, ...(supportsBody ? [{ id: "body", label: "Body" }] : []), { id: "code", label: "Code" },
                ]} />
                <div role="tabpanel" id={"request-settings-" + visibleReqTab} aria-labelledby={"request-settings-tab-" + visibleReqTab} className="min-h-52 p-4 sm:p-5">
                  {visibleReqTab === "params" && <RequestRows label="Parameter" rows={params} onChange={setParamsAndUrl} />}
                  {visibleReqTab === "headers" && <RequestRows label="Header" rows={headers} onChange={setHeaders} />}
                  {visibleReqTab === "auth" && <div className="space-y-4">
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
                  {visibleReqTab === "body" && <div className="space-y-4">
                    <div className="flex justify-end"><label className="sr-only" htmlFor="request-body-format">Body format</label><select id="request-body-format" value={bodyType} onChange={event => { setBodyType(event.target.value as typeof bodyType); setJsonError(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"><option value="json">JSON</option><option value="urlencoded">Form</option><option value="raw">Text</option><option value="none">No body</option></select></div>
                    {bodyType === "json" && <div>
                      <div className="mb-2 flex items-center justify-between"><label htmlFor="json-body" className="text-xs font-medium text-slate-700">JSON body</label><IconButton label="Format JSON" onClick={formatJson}><Braces size={16} /></IconButton></div>
                      <textarea id="json-body" spellCheck={false} value={bodyJson} onChange={event => { setBodyJson(event.target.value); setJsonError(null); }} aria-invalid={!!jsonError} aria-describedby={jsonError ? "json-body-error" : undefined} rows={12} className={fieldClass + " resize-y font-mono leading-6"} />
                      {jsonError && <p id="json-body-error" role="alert" className="mt-2 text-xs text-red-700">{jsonError}</p>}
                    </div>}
                    {bodyType === "raw" && <label className="block text-xs font-medium text-slate-700">Plain text body<textarea spellCheck={false} value={bodyRaw} onChange={event => setBodyRaw(event.target.value)} rows={12} placeholder="Enter request body" className={fieldClass + " mt-2 resize-y font-mono leading-6"} /></label>}
                    {bodyType === "urlencoded" && <RequestRows label="Form field" rows={bodyFormData} onChange={setBodyFormData} />}
                  </div>}
                  {visibleReqTab === "code" && <div className="space-y-4">
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
          <label className="mt-4 block text-sm font-medium">Save to<select name="collection" aria-label="Save to collection" defaultValue={collectionId} className={fieldClass + " mt-2"}>{collections.map(item => <option key={item.id} value={item.id}>{item.id === DEFAULT_COLLECTION.id ? "Unfiled requests" : item.name}</option>)}</select></label>
          <p className="mt-3 text-xs leading-5 text-slate-500">Saved in this browser. Authentication and custom header values are removed; request bodies are retained.</p>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setSaveModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={!saveName.trim()} className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">Save request</button></div>
        </form>
      </dialog>
      {tabMenu && createPortal(<div ref={tabMenuRef} role="menu" aria-label="Tab actions" style={{ left: tabMenu.left, top: tabMenu.top }} className="fixed z-50 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
        <button role="menuitem" type="button" onClick={() => { setTabMenu(null); openRequest(); }} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100">New request</button>
        <button role="menuitem" type="button" onClick={() => { closeRequestTab(tabMenu.id); setTabMenu(null); }} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100">Close tab</button>
        <button role="menuitem" type="button" disabled={openTabs.length < 2} onClick={() => closeRequestTabs(tabMenu.id, 'others')} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100 disabled:text-slate-300">Close other tabs</button>
        <button role="menuitem" type="button" disabled={openTabs.findIndex(tab => tab.id === tabMenu.id) === 0} onClick={() => closeRequestTabs(tabMenu.id, 'left')} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100 disabled:text-slate-300">Close tabs to the left</button>
        <button role="menuitem" type="button" disabled={openTabs.findIndex(tab => tab.id === tabMenu.id) === openTabs.length - 1} onClick={() => closeRequestTabs(tabMenu.id, 'right')} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100 disabled:text-slate-300">Close tabs to the right</button>
        <button role="menuitem" type="button" onClick={() => closeRequestTabs(tabMenu.id, 'all')} className="block w-full rounded border-t border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-100">Close all tabs</button>
      </div>, document.body)}
      {requestMenu && createPortal(<div ref={requestMenuRef} role="menu" aria-label="Request actions" style={{ left: requestMenu.left, top: requestMenu.top, maxHeight: 'min(380px, 80vh)' }} className="fixed z-50 w-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
        <button type="button" role="menuitem" onClick={() => { openRequest(requestMenu.request, !requestMenu.recent); setRequestMenu(null); }} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100">Open request</button>
        <button type="button" role="menuitem" onClick={() => { const copy = sanitizeApiRequest({ ...requestMenu.request, id: crypto.randomUUID(), name: (requestMenu.request.name || 'Request') + ' copy', collectionId: requestMenu.recent ? DEFAULT_COLLECTION.id : requestMenu.request.collectionId, createdAt: Date.now(), timestamp: Date.now() }); const next = [...savedRequests, copy]; setSavedRequests(next); persistRequests('msyn_api_client_saved', next); setRequestMenu(null); }} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100">Duplicate request</button>
        <button type="button" role="menuitem" onClick={() => { openRequest(requestMenu.request, !requestMenu.recent); setSaveName(requestMenu.request.name); setSaveModalOpen(true); setRequestMenu(null); }} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-100">Rename request</button>
        <p className="border-t border-slate-100 px-3 pt-2 text-[10px] text-slate-400">Move to</p>
        {collections.filter(item => requestMenu.recent || item.id !== (requestMenu.request.collectionId || DEFAULT_COLLECTION.id)).map(item => <button type="button" role="menuitem" key={item.id} onClick={() => moveRequest(requestMenu.request, requestMenu.recent, item.id)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-slate-100"><Folder size={13} />{item.id === DEFAULT_COLLECTION.id ? 'Unfiled requests' : item.name}</button>)}
        <button type="button" role="menuitem" onClick={() => deleteRequest(requestMenu.request, requestMenu.recent)} className="block w-full rounded border-t border-slate-100 px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50">Delete request</button>
      </div>, document.body)}
      {collectionMenu && createPortal(
        <div ref={collectionMenuRef} role="menu" aria-label={"Collection actions for " + collectionMenu.collection.name} style={{ left: collectionMenu.left, top: collectionMenu.top }} className="fixed z-[70] w-[200px] rounded-md border border-slate-200 bg-white p-1 shadow-lg" onKeyDown={event => {
          const buttons = Array.from(event.currentTarget.querySelectorAll < HTMLButtonElement > ('[role="menuitem"]'));
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

function LibraryRequestRow({ request, recent, active, onOpen, onMenu, onMove, onDropTarget, onRename }: { request: SavedRequest; recent: boolean; active: boolean; onRename: (name: string) => void; onOpen: () => void; onMenu: (x: number, y: number) => void; onMove: (destination: string) => void; onDropTarget: (id: string | null) => void }) {
  const rightDrag = useRef < { x: number; y: number; moved: boolean } | null > (null);
  const suppressContext = useRef(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const finishName = () => { if (name.trim()) onRename(name); setEditing(false); };
  return <div key={(recent ? 'recent-' : '') + request.id}
    draggable={!editing} onDragStart={event => { event.dataTransfer.setData('application/x-msyn-request', JSON.stringify({ id: request.id, recent })); event.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => onDropTarget(null)}
    onContextMenu={event => { event.preventDefault(); if (suppressContext.current) { suppressContext.current = false; return; } onMenu(event.clientX, event.clientY); }}
    onPointerDown={event => { if (event.button !== 2) return; suppressContext.current = false; rightDrag.current = { x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { const drag = rightDrag.current; if (!drag || !(event.buttons & 2)) return; if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true; if (drag.moved) { onDropTarget(document.elementFromPoint(event.clientX, event.clientY)?.closest < HTMLElement > ('[data-collection-drop]')?.dataset.collectionDrop || null); } }}
    onPointerUp={event => { const drag = rightDrag.current; rightDrag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (drag?.moved) { suppressContext.current = true; const target = document.elementFromPoint(event.clientX, event.clientY)?.closest < HTMLElement > ('[data-collection-drop]')?.dataset.collectionDrop; if (target) onMove(target); } onDropTarget(null); }}
    onPointerCancel={() => { rightDrag.current = null; onDropTarget(null); }}
    className={'flex items-center rounded ' + (active ? 'bg-[var(--brand-soft)]' : 'hover:bg-slate-200/60')}>
    {editing ? <input autoFocus aria-label="Edit request name" value={name} onChange={event => setName(event.target.value)} onBlur={finishName} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } if (event.key === "Escape") { event.preventDefault(); setEditing(false); } }} className="m-1 w-0 min-w-0 flex-1 rounded border border-violet-400 bg-white px-2 py-1.5 text-xs outline-none" /> : <button type="button" title={request.url} onClick={() => onOpen()} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"><span className={'w-11 shrink-0 font-mono text-[10px] font-bold ' + METHOD_COLORS[request.method].text}>{request.method}</span><span className="truncate text-xs text-slate-600">{request.name || request.url}</span></button>}
    {!editing && <button type="button" aria-label={"Rename " + (request.name || request.url)} onClick={() => { setName(request.name || ""); setEditing(true); }} className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><Pencil size={12} /></button>}
    <button type="button" aria-label={'Actions for request ' + (request.name || request.url)} aria-haspopup="menu" onClick={event => { const bounds = event.currentTarget.getBoundingClientRect(); onMenu(bounds.left, bounds.bottom); }} className="shrink-0 rounded p-2 text-slate-500 hover:bg-slate-200"><MoreHorizontal size={15} /></button>
  </div>;
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
    if (next >= 0) { event.preventDefault(); onChange(items[next].id); event.currentTarget.querySelectorAll < HTMLButtonElement > ('[role="tab"]')[next].focus(); }
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
