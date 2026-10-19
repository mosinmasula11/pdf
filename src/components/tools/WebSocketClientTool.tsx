"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Bookmark, Check, Copy, Download, Plug, Radio, Search, Send, Trash2, Unplug, X } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { appendSocketLog, loadSocketProfiles, parseSocketUrl, sanitizeSocketProfile, SocketSession } from "@/lib/websocket-client";
import type { SocketLogEntry, SocketProfile, SocketState } from "@/lib/websocket-client";
import { prepareSocketRequest } from "@/lib/websocket-auth";
import { RelaySocket } from "@/lib/websocket-relay-client";
import { EMPTY_SOCKET_CONFIG, WebSocketRequestConfig } from "./WebSocketRequestConfig";
import type { SocketRequestConfig } from "./WebSocketRequestConfig";

const field = "w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]";
const primary = "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50";
const titles = { disconnected: "Disconnected", connecting: "Connecting", connected: "Connected", error: "Connection failed" };

export function WebSocketClientTool({ onStateChange }: { onStateChange: (state: SocketState) => void }) {
  const [url, setUrl] = useState("");
  const [protocols, setProtocols] = useState("");
  const [config, setConfig] = useState<SocketRequestConfig>(EMPTY_SOCKET_CONFIG);
  const [state, setState] = useState<SocketState>("disconnected");
  const [connectionError, setConnectionError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<"text" | "json" | "binary">("text");
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<SocketLogEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [saved, setSaved] = useState<SocketProfile[]>([]);
  const [recent, setRecent] = useState<SocketProfile[]>([]);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const session = useRef<SocketSession | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const saveDialog = useRef<HTMLDialogElement>(null);
  const locked = state === "connecting" || state === "connected";

  useEffect(() => {
    let mounted = true;
    const connection = new SocketSession({
      onState: value => { setState(value); onStateChange(value); },
      onEvent: entry => {
        setEntries(previous => appendSocketLog(previous, entry));
        if (entry.kind === "error") setConnectionError(entry.text);
      },
    });
    session.current = connection;
    queueMicrotask(() => {
      if (!mounted) return;
      try {
        setSaved(loadSocketProfiles(JSON.parse(localStorage.getItem("msyn_websocket_saved") || "[]")));
        setRecent(loadSocketProfiles(JSON.parse(localStorage.getItem("msyn_websocket_recent") || "[]")));
      } catch { setNotice("Saved connections are unavailable in this browser."); }
    });
    return () => { mounted = false; connection.dispose(); session.current = null; };
  }, [onStateChange]);

  useEffect(() => { if (autoScroll && log.current) log.current.scrollTop = log.current.scrollHeight; }, [entries, autoScroll]);
  useEffect(() => {
    if (saveOpen) { saveDialog.current?.showModal(); saveDialog.current?.querySelector<HTMLInputElement>("input")?.focus(); }
    else saveDialog.current?.close();
  }, [saveOpen]);

  const persist = (key: string, items: SocketProfile[]) => {
    try { localStorage.setItem(key, JSON.stringify(items)); }
    catch { setNotice("Browser storage is unavailable. Connections are only retained for this visit."); }
  };
  const connect = () => {
    setConnectionError(""); setMessageError("");
    try {
      if (!session.current) throw new Error("The WebSocket client is not ready yet.");
      const prepared = prepareSocketRequest(parseSocketUrl(url, window.location.protocol), config.params, config.headers, config.auth);
      const hasHeaders = Object.keys(prepared.headers).length > 0;
      if (hasHeaders && config.transport !== "relay") throw new Error("Custom authentication headers require MSYN relay mode. Select it under Settings.");
      if (config.transport === "relay" && !prepared.url.startsWith("wss://")) throw new Error("Relay mode requires a public wss:// endpoint. Use direct mode for local ws:// servers.");
      const endpoint = session.current.connect(prepared.url, protocols, window.location.protocol,
        config.transport === "relay" ? (target, requestedProtocols) => new RelaySocket(target, requestedProtocols, prepared.headers) as unknown as WebSocket : undefined);
      const profile = sanitizeSocketProfile({ id: crypto.randomUUID(), name: new URL(endpoint).host + new URL(endpoint).pathname, url: endpoint });
      const next = [profile, ...recent.filter(item => item.url !== profile.url)].slice(0, 10);
      setRecent(next); persist("msyn_websocket_recent", next);
    } catch (error) { setConnectionError(error instanceof Error ? error.message : "Could not start the WebSocket connection."); }
  };
  const send = () => {
    setMessageError("");
    try {
      if (!session.current) throw new Error("Connect before sending a message.");
      if (format === "binary") {
        if (!file) throw new Error("Choose a binary file first.");
        session.current.sendBinary(file, file.name);
      } else session.current.sendText(message, format);
    } catch (error) { setMessageError(error instanceof Error ? error.message : "Could not send the message."); }
  };
  const restore = (profile: SocketProfile) => { setUrl(profile.url); setProtocols(""); setConfig({ ...EMPTY_SOCKET_CONFIG, auth: { ...EMPTY_SOCKET_CONFIG.auth } }); setConnectionError(""); };
  const saveConnection = () => {
    try {
      const profile = sanitizeSocketProfile({ id: crypto.randomUUID(), name: saveName, url });
      const next = [profile, ...saved].slice(0, 25); setSaved(next); persist("msyn_websocket_saved", next);
      setSaveOpen(false);
    } catch (error) { setConnectionError(error instanceof Error ? error.message : "Could not save connection."); setSaveOpen(false); }
  };
  const visible = useMemo(() => entries.filter(entry => (filter === "all" || entry.kind === filter) && entry.text.toLowerCase().includes(search.toLowerCase())), [entries, filter, search]);

  return <div className="border-y border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><Radio size={17} />WebSocket workspace</h2>
      <span role="status" className={"inline-flex items-center gap-2 text-xs font-semibold " + (state === "connected" ? "text-emerald-700" : state === "error" ? "text-red-700" : "text-slate-500")}><span className={"h-2 w-2 rounded-full " + (state === "connected" ? "bg-emerald-600" : state === "connecting" ? "animate-pulse bg-amber-500" : state === "error" ? "bg-red-600" : "bg-slate-400")} />{titles[state]}</span>
    </div>
    <div className="flex min-w-0 flex-col lg:flex-row">
      <aside aria-label="WebSocket connections" className="w-full shrink-0 border-b border-slate-200 bg-slate-50 p-3 lg:w-64 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-slate-600">Saved connections ({saved.length})</h3><button type="button" title="Save WebSocket connection" aria-label="Save WebSocket connection" onClick={() => {
          try { parseSocketUrl(url); setSaveName(""); setSaveOpen(true); } catch (error) { setConnectionError(error instanceof Error ? error.message : "Enter a WebSocket URL first."); }
        }} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-200"><Bookmark size={16} /></button></div>
        {!saved.length && <p className="py-3 text-xs text-slate-400">No saved connections.</p>}
        <div className="max-h-60 overflow-y-auto">{saved.map(profile => <div key={profile.id} className="flex items-center border-b border-slate-200">
          <button type="button" disabled={locked} onClick={() => restore(profile)} title={profile.url} className="min-w-0 flex-1 truncate py-3 text-left text-xs text-slate-700 hover:text-[var(--brand)] disabled:opacity-50">{profile.name}</button>
          <button type="button" aria-label={"Delete connection " + profile.name} title="Delete connection" onClick={() => { const next = saved.filter(item => item.id !== profile.id); setSaved(next); persist("msyn_websocket_saved", next); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:text-red-700"><Trash2 size={14} /></button>
        </div>)}</div>
        <div className="mt-5 flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-600">Recent connections</h3><button type="button" aria-label="Clear recent WebSocket connections" title="Clear recent connections" disabled={!recent.length} onClick={() => { setRecent([]); persist("msyn_websocket_recent", []); }} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-red-700 disabled:opacity-30"><Trash2 size={14} /></button></div>
        {!recent.length && <p className="py-3 text-xs text-slate-400">No recent connections.</p>}
        <div className="max-h-52 overflow-y-auto">{recent.map(profile => <button type="button" disabled={locked} key={profile.id} onClick={() => restore(profile)} title={profile.url} className="block w-full truncate border-b border-slate-200 py-3 text-left font-mono text-[11px] text-slate-500 hover:text-[var(--brand)] disabled:opacity-50">{profile.name}</button>)}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <form onSubmit={event => { event.preventDefault(); connect(); }} className="flex flex-wrap gap-2 px-4 pt-4">
          <label htmlFor="websocket-url" className="sr-only">WebSocket URL</label>
          <input id="websocket-url" type="text" inputMode="url" autoComplete="off" spellCheck={false} disabled={locked} value={url} onChange={event => { setUrl(event.target.value); setConnectionError(""); }} placeholder="wss://api.example.com/socket" required className={field + " h-11 flex-1 basis-52 font-mono disabled:bg-slate-50"} />
          {locked ? <button key="disconnect" type="button" onClick={event => { event.preventDefault(); session.current?.disconnect(); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"><Unplug size={16} />{state === "connecting" ? "Cancel connection" : "Disconnect"}</button> : <button key="connect" type="submit" disabled={!url.trim()} className={primary}><Plug size={16} />Connect</button>}
        </form>
        <div className="grid gap-3 px-4 pt-3 pb-4 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-medium text-slate-600">Subprotocols (optional)<input aria-label="WebSocket subprotocols" disabled={locked} value={protocols} onChange={event => setProtocols(event.target.value)} placeholder="e.g. graphql-transport-ws" className={field + " mt-2 disabled:bg-slate-50"} /></label>
          <p className="self-end pb-2 text-xs text-slate-500">{config.transport === "relay" ? "MSYN relay" : "Direct browser connection"} | 2 MB message limit</p>
        </div>
        {connectionError && <p role="alert" className="mx-4 mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{connectionError}</p>}
        {notice && <p role="status" className="mx-4 mb-4 text-xs text-amber-800">{notice}</p>}

        <WebSocketRequestConfig value={config} onChange={setConfig} locked={locked} />
        <section aria-label="WebSocket message composer" className="border-y border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Message</h3>
            <label className="flex items-center gap-2 text-xs text-slate-600">Format<select aria-label="WebSocket message format" value={format} onChange={event => { setFormat(event.target.value as typeof format); setMessageError(""); }} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"><option value="text">Text</option><option value="json">JSON</option><option value="binary">Binary file</option></select></label>
          </div>
          {format === "binary" ? <label className="block text-xs font-medium text-slate-600">Binary message file<input type="file" aria-label="Binary message file" onChange={event => { setFile(event.target.files?.[0] || null); setMessageError(""); }} className={field + " mt-2"} />{file && <span className="mt-2 block text-xs text-slate-400">{file.name} | {formatBytes(file.size)}</span>}</label>
            : <label htmlFor="websocket-message" className="block"><span className="sr-only">WebSocket message</span><textarea id="websocket-message" value={message} onChange={event => { setMessage(event.target.value); setMessageError(""); }} onKeyDown={event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); send(); } }} aria-invalid={!!messageError} aria-describedby={messageError ? "websocket-message-error" : undefined} rows={5} placeholder={format === "json" ? '{"type":"hello","message":"Hello"}' : "Enter message"} spellCheck={false} className={field + " resize-y font-mono text-xs leading-6"} /></label>}
          {messageError && <p id="websocket-message-error" role="alert" className="mt-2 text-xs text-red-700">{messageError}</p>}
          <div className="mt-3 flex justify-end"><button type="button" onClick={send} disabled={state !== "connected"} className={primary}><Send size={15} />Send message</button></div>
        </section>

        <section aria-label="WebSocket message log">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Messages ({entries.length})</h3>
            <div className="flex items-center gap-3"><label className="inline-flex items-center gap-1.5 text-xs text-slate-500"><input type="checkbox" checked={autoScroll} onChange={event => setAutoScroll(event.target.checked)} className="accent-[var(--brand)]" />Auto-scroll</label>
              <button type="button" title="Download WebSocket log" aria-label="Download WebSocket log" disabled={!entries.length} onClick={() => downloadBlob(new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" }), "websocket-log.json")} className="text-slate-500 hover:text-[var(--brand)] disabled:opacity-30"><Download size={16} /></button>
              <button type="button" title="Clear WebSocket log" aria-label="Clear WebSocket log" disabled={!entries.length} onClick={() => setEntries([])} className="text-slate-500 hover:text-red-700 disabled:opacity-30"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 px-2 text-slate-400"><Search size={14} /><input type="search" aria-label="Search WebSocket messages" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search messages" className="h-8 min-w-0 flex-1 text-xs text-slate-700 outline-none" /></label>
            <select aria-label="Filter WebSocket messages" value={filter} onChange={event => setFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs text-slate-600"><option value="all">All events</option><option value="sent">Sent</option><option value="received">Received</option><option value="system">Connection events</option><option value="error">Errors</option></select>
          </div>
          <div ref={log} role="log" aria-label="WebSocket events" aria-live="polite" aria-relevant="additions" className="h-96 overflow-y-auto">
            {!visible.length && <p className="p-8 text-center text-sm text-slate-400">{entries.length ? "No matching messages." : "No messages yet."}</p>}
            {visible.map(entry => <article key={entry.id} className={"border-b border-slate-100 px-4 py-3 " + (entry.kind === "error" ? "bg-red-50" : "")}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className={"inline-flex items-center gap-1.5 font-semibold " + (entry.kind === "received" ? "text-emerald-700" : entry.kind === "sent" ? "text-[var(--brand)]" : entry.kind === "error" ? "text-red-700" : "text-slate-500")}>{entry.kind === "sent" ? <ArrowUpRight size={13} /> : entry.kind === "received" ? <ArrowDownLeft size={13} /> : <Radio size={12} />}{entry.kind === "sent" ? "Sent" : entry.kind === "received" ? "Received" : entry.kind === "error" ? "Error" : "Connection"}{entry.binary && " | Binary"}</span>
                <div className="inline-flex items-center gap-3 text-slate-400"><time dateTime={new Date(entry.timestamp).toISOString()}>{new Date(entry.timestamp).toLocaleTimeString()}</time><span>{formatBytes(entry.bytes)}</span><button type="button" aria-label={entry.truncated ? "Copy message preview" : "Copy WebSocket event"} title="Copy message" onClick={async () => { try { await navigator.clipboard.writeText(entry.text); setCopied(entry.id); setTimeout(() => setCopied(null), 1500); } catch { setNotice("Clipboard access was denied. Download the log instead."); } }}>{copied === entry.id ? <Check size={13} /> : <Copy size={13} />}</button></div>
              </div>
              <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-700">{entry.text || "(empty message)"}</pre>
              {entry.truncated && <p className="mt-2 text-[10px] text-amber-700">Preview limited to 64 KB.</p>}
            </article>)}
          </div>
          <p className="border-t border-slate-200 px-4 py-3 text-[10px] leading-5 text-slate-400">Messages stay in memory. The log retains up to 200 events within 2 MB. Saved connections omit query values and subprotocols.</p>
        </section>
      </div>
    </div>
    <dialog ref={saveDialog} aria-labelledby="save-socket-title" onCancel={() => setSaveOpen(false)} onClose={() => setSaveOpen(false)} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-black/40">
      <form onSubmit={event => { event.preventDefault(); saveConnection(); }}>
        <div className="flex items-center justify-between"><h2 id="save-socket-title" className="text-lg font-semibold text-slate-900">Save WebSocket connection</h2><button type="button" aria-label="Close WebSocket save dialog" onClick={() => setSaveOpen(false)} className="text-slate-500"><X size={18} /></button></div>
        <label className="mt-5 block text-sm font-medium text-slate-700">Connection name<input value={saveName} onChange={event => setSaveName(event.target.value)} required maxLength={80} placeholder="e.g. Notifications stream" className={field + " mt-2"} /></label>
        <p className="mt-3 text-xs leading-5 text-slate-500">Saved in this browser. Query values and subprotocols are excluded; messages are not saved.</p>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setSaveOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={!saveName.trim()} className={primary}>Save connection</button></div>
      </form>
    </dialog>
  </div>;
}
