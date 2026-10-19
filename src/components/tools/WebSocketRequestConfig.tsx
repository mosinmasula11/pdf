"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EMPTY_SOCKET_AUTH } from "@/lib/websocket-auth";
import type { SocketAuth, SocketPair } from "@/lib/websocket-auth";

export interface SocketRequestConfig { auth: SocketAuth; params: SocketPair[]; headers: SocketPair[]; transport: "direct" | "relay" }
export const EMPTY_SOCKET_CONFIG: SocketRequestConfig = { auth: { ...EMPTY_SOCKET_AUTH }, params: [], headers: [], transport: "direct" };
const field = "w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] disabled:bg-slate-50";
export function WebSocketRequestConfig({ value, onChange, locked }: { value: SocketRequestConfig; onChange: (value: SocketRequestConfig) => void; locked: boolean }) {
  const [tab, setTab] = useState<"params" | "auth" | "headers" | "settings">("auth");
  const updateAuth = (change: Partial<SocketAuth>) => {
    const auth = { ...value.auth, ...change };
    onChange({ ...value, auth, transport: auth.type === "bearer" || auth.type === "basic" || (auth.type === "apiKey" && auth.location === "header") ? "relay" : value.transport });
  };
  const pairs = (kind: "params" | "headers") => <div>
    <div className="space-y-2">{value[kind].map((row, index) => <div key={row.id} className="flex items-start gap-2">
      <input aria-label={kind + " " + (index + 1) + " enabled"} type="checkbox" disabled={locked} checked={row.enabled} onChange={event => onChange({ ...value, [kind]: value[kind].map(item => item.id === row.id ? { ...item, enabled: event.target.checked } : item) })} className="mt-3 accent-[var(--brand)]" />
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        <input aria-label={kind + " " + (index + 1) + " name"} value={row.key} disabled={locked} placeholder={kind === "headers" ? "Header name" : "Parameter name"} onChange={event => onChange({ ...value, [kind]: value[kind].map(item => item.id === row.id ? { ...item, key: event.target.value } : item) })} className={field} />
        <input aria-label={kind + " " + (index + 1) + " value"} type="password" autoComplete="off" value={row.value} disabled={locked} placeholder="Value" onChange={event => onChange({ ...value, [kind]: value[kind].map(item => item.id === row.id ? { ...item, value: event.target.value } : item) })} className={field} />
      </div>
      <button type="button" disabled={locked} aria-label={"Remove " + kind + " " + (index + 1)} title="Remove row" onClick={() => onChange({ ...value, [kind]: value[kind].filter(item => item.id !== row.id) })} className="p-2 text-slate-500 hover:text-red-700 disabled:opacity-40"><Trash2 size={16} /></button>
    </div>)}</div>
    <button type="button" disabled={locked || value[kind].length >= 32} onClick={() => onChange({ ...value, transport: kind === "headers" ? "relay" : value.transport, [kind]: [...value[kind], { id: crypto.randomUUID(), enabled: true, key: "", value: "" }] })} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] disabled:opacity-40"><Plus size={14} />Add {kind === "headers" ? "header" : "parameter"}</button>
  </div>;
  return <section aria-label="WebSocket request settings" className="border-b border-slate-200">
    <div role="tablist" aria-label="WebSocket connection settings" className="flex overflow-x-auto border-b border-slate-200 px-4">
      {(["params", "auth", "headers", "settings"] as const).map(name => <button key={name} id={"ws-config-" + name} type="button" role="tab" aria-selected={tab === name} aria-controls="ws-config-panel" onClick={() => setTab(name)} className={"shrink-0 border-b-2 px-3 py-3 text-xs font-medium " + (tab === name ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500")}>{name === "auth" ? "Authorization" : name === "params" ? "Params" : name === "headers" ? "Headers" : "Settings"}{(name === "params" || name === "headers") && value[name].length > 0 ? " (" + value[name].length + ")" : ""}</button>)}
    </div>
    <div id="ws-config-panel" role="tabpanel" aria-labelledby={"ws-config-" + tab} className="p-4">
      {tab === "params" && pairs("params")}
      {tab === "headers" && <>{pairs("headers")}<p className="mt-3 text-xs leading-5 text-slate-500">Custom handshake headers use the MSYN relay. Authorization values are not saved.</p></>}
      {tab === "auth" && <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <label className="text-xs font-medium text-slate-600">Auth type<select aria-label="WebSocket auth type" value={value.auth.type} disabled={locked} onChange={event => updateAuth({ type: event.target.value as SocketAuth["type"] })} className={field + " mt-2"}><option value="none">No Auth</option><option value="bearer">Bearer Token</option><option value="basic">Basic Auth</option><option value="apiKey">API Key</option></select></label>
        <div className="space-y-3">
          {value.auth.type === "none" && <p className="text-xs leading-5 text-slate-500">No authentication header will be added. Eligible browser cookies are sent in direct mode.</p>}
          {value.auth.type === "bearer" && <label className="block text-xs font-medium text-slate-600">Token<input aria-label="WebSocket Bearer token" type="password" autoComplete="off" disabled={locked} value={value.auth.token} onChange={event => updateAuth({ token: event.target.value })} placeholder="Bearer token" className={field + " mt-2"} /></label>}
          {value.auth.type === "basic" && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-600">Username<input aria-label="WebSocket Basic username" disabled={locked} autoComplete="off" value={value.auth.username} onChange={event => updateAuth({ username: event.target.value })} className={field + " mt-2"} /></label><label className="text-xs text-slate-600">Password<input aria-label="WebSocket Basic password" type="password" disabled={locked} autoComplete="off" value={value.auth.password} onChange={event => updateAuth({ password: event.target.value })} className={field + " mt-2"} /></label></div>}
          {value.auth.type === "apiKey" && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-600">Key<input aria-label="WebSocket API key name" disabled={locked} value={value.auth.key} placeholder="X-API-Key" onChange={event => updateAuth({ key: event.target.value })} className={field + " mt-2"} /></label><label className="text-xs text-slate-600">Value<input aria-label="WebSocket API key value" type="password" autoComplete="off" disabled={locked} value={value.auth.value} onChange={event => updateAuth({ value: event.target.value })} className={field + " mt-2"} /></label><label className="text-xs text-slate-600">Add to<select aria-label="WebSocket API key location" disabled={locked} value={value.auth.location} onChange={event => updateAuth({ location: event.target.value as "header" | "query" })} className={field + " mt-2"}><option value="header">Header</option><option value="query">Query Params</option></select></label></div>}
        </div>
      </div>}
      {tab === "settings" && <label className="block max-w-md text-xs font-medium text-slate-600">Connection mode<select aria-label="WebSocket connection mode" disabled={locked} value={value.transport} onChange={event => onChange({ ...value, transport: event.target.value as "direct" | "relay" })} className={field + " mt-2"}><option value="direct">Direct browser connection</option><option value="relay">MSYN relay (custom headers)</option></select></label>}
      <p className="mt-3 text-xs leading-5 text-slate-500">{value.transport === "relay" ? "Relay mode: credentials and messages pass through the MSYN server to your endpoint. Public wss:// endpoints on port 443 only; TLS verification stays enabled. Connections expire after 5 minutes." : "Direct mode: connects from your browser. Custom headers require relay mode."}</p>
    </div>
  </section>;
}
