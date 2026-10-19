"use client";

import { useState } from "react";
import { Globe, Radio } from "lucide-react";
import { ApiClientTool } from "./ApiClientTool";
import { WebSocketClientTool } from "./WebSocketClientTool";
import type { SocketState } from "@/lib/websocket-client";

export function ApiClientWorkspace() {
  const [mode, setMode] = useState<"http" | "websocket">("http");
  const [socketState, setSocketState] = useState<SocketState>("disconnected");
  return (
    <div>
      <div role="tablist" aria-label="API protocol" className="mb-4 flex gap-1 border-b border-slate-200">
        <button id="protocol-http" role="tab" type="button" aria-selected={mode === "http"} aria-controls="http-workspace" onClick={() => setMode("http")} className={"inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium " + (mode === "http" ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500")}><Globe size={16} />HTTP</button>
        <button id="protocol-websocket" role="tab" type="button" aria-selected={mode === "websocket"} aria-controls="websocket-workspace" onClick={() => setMode("websocket")} className={"inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium " + (mode === "websocket" ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500")}><Radio size={16} />WebSocket{socketState === "connected" && <span aria-label="Connected" className="h-2 w-2 rounded-full bg-emerald-600" />}</button>
      </div>
      <div id="http-workspace" role="tabpanel" aria-labelledby="protocol-http" hidden={mode !== "http"}><ApiClientTool /></div>
      <div id="websocket-workspace" role="tabpanel" aria-labelledby="protocol-websocket" hidden={mode !== "websocket"}><WebSocketClientTool onStateChange={setSocketState} /></div>
    </div>
  );
}
