"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  KeyRound,
  FileCode,
  Clock,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";

// Safe base64url decoding with full Unicode support
function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    if (!/^[A-Za-z0-9_-]+$/.test(str)) throw new Error("Invalid Base64Url encoding");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Invalid Base64Url encoding");
  }
}

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggSm9obnNvbiIsImVtYWlsIjoiYWxleEBleGFtcGxlLmNvbSIsInJvbGVzIjpbImFkbWluIiwidXNlciJdLCJpYXQiOjE3MTY4NzYwMDAsImV4cCI6MTc4OTk5OTAwMH0." +
  "R2jQiJqtEI_cItkzgvE1YOnyRovZJRFfwxFSFR7Gv7k";

export function JwtDebuggerTool() {
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_JWT);
  const [secretKey, setSecretKey] = useState<string>("your-256-bit-secret");
  const [headerJson, setHeaderJson] = useState<string>("");
  const [payloadJson, setPayloadJson] = useState<string>("");
  const [signatureStr, setSignatureStr] = useState<string>("");
  const [headerRaw, setHeaderRaw] = useState<string>("");
  const [payloadRaw, setPayloadRaw] = useState<string>("");

  const [headerObj, setHeaderObj] = useState<Record<string, unknown> | null>(null);
  const [payloadObj, setPayloadObj] = useState<Record<string, unknown> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<{ token: string; secret: string; valid: boolean } | null>(null);
  const signatureValid = verification?.token === tokenInput.trim() && verification.secret === secretKey ? verification.valid : null;
  const [verifying, setVerifying] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [currentNow, setCurrentNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(Date.now()), 1000);
    queueMicrotask(() => setCurrentNow(Date.now()));
    return () => clearInterval(timer);
  }, []);

  // Parse token whenever input changes
  useEffect(() => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setHeaderJson("");
      setPayloadJson("");
      setSignatureStr("");
      setHeaderObj(null);
      setPayloadObj(null);
      setError(null);
      setVerification(null);
      return;
    }

    const parts = trimmed.split(".");
    if (parts.length !== 3) {
      setError("A valid JWT must contain exactly 3 dot-separated parts (Header.Payload.Signature).");
      setHeaderJson("");
      setPayloadJson("");
      setSignatureStr("");
      setHeaderObj(null);
      setPayloadObj(null);
      setVerification(null);
      return;
    }

    const [h, p, s] = parts;
    setHeaderRaw(h);
    setPayloadRaw(p);
    setSignatureStr(s);

    try {
      const decodedH = base64UrlDecode(h);
      if (tokenInput.length > 100_000) throw new Error("JWT exceeds the 100 KB limit.");
      const parsedH = JSON.parse(decodedH);
      if (!parsedH || typeof parsedH !== "object" || Array.isArray(parsedH)) throw new Error("JWT header must be a JSON object.");
      setHeaderJson(JSON.stringify(parsedH, null, 2));
      setHeaderObj(parsedH);

      const decodedP = base64UrlDecode(p);
      const parsedP = JSON.parse(decodedP);
      if (!parsedP || typeof parsedP !== "object" || Array.isArray(parsedP)) throw new Error("JWT payload must be a JSON object.");
      setPayloadJson(JSON.stringify(parsedP, null, 2));
      setPayloadObj(parsedP);

      setError(null);
    } catch (e) {
      setError("Failed to decode token parts: " + (e instanceof Error ? e.message : "Malformed JSON"));
      setHeaderJson("");
      setPayloadJson("");
      setHeaderObj(null);
      setPayloadObj(null);
    }
  }, [tokenInput]);

  // Verify Signature for HS256
  const verifySignature = async () => {
    if (!headerRaw || !payloadRaw || !signatureStr || !secretKey) {
      setVerification(null);
      return;
    }

    const alg = headerObj?.alg;
    if (alg !== "HS256") {
      setVerification(null);
      return;
    }

    const verifiedToken = tokenInput.trim();
    const verifiedSecret = secretKey;
    setVerifying(true);
    try {
      const enc = new TextEncoder();
      const keyData = enc.encode(secretKey);
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const [h, p, signature] = verifiedToken.split(".");
      if (!/^[A-Za-z0-9_-]+$/.test(signature)) throw new Error("Invalid signature encoding.");
      const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
      const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, enc.encode(h + "." + p));
      setVerification({ token: verifiedToken, secret: verifiedSecret, valid });
    } catch {
      setVerification({ token: verifiedToken, secret: verifiedSecret, valid: false });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Human date formatting for JWT timestamps (seconds)
  const formatJwtDate = (epochSec?: unknown): { date: string; relative: string; isExpired?: boolean } => {
    if (typeof epochSec !== "number" || !Number.isFinite(epochSec) || !Number.isFinite(new Date(epochSec * 1000).getTime())) return { date: "Invalid", relative: "" };
    const date = new Date(epochSec * 1000);
    const now = currentNow ?? date.getTime();
    const diffSec = currentNow !== null ? Math.round((date.getTime() - now) / 1000) : 0;

    const isExpired = diffSec < 0;
    const absDiff = Math.abs(diffSec);

    let relative = "";
    if (absDiff < 60) {
      relative = isExpired ? `${absDiff}s ago` : `in ${absDiff}s`;
    } else if (absDiff < 3600) {
      const mins = Math.floor(absDiff / 60);
      relative = isExpired ? `${mins}m ago` : `in ${mins}m`;
    } else if (absDiff < 86400) {
      const hrs = Math.floor(absDiff / 3600);
      relative = isExpired ? `${hrs}h ago` : `in ${hrs}h`;
    } else {
      const days = Math.floor(absDiff / 86400);
      relative = isExpired ? `${days} days ago` : `in ${days} days`;
    }

    return {
      date: date.toLocaleString(),
      relative,
      isExpired,
    };
  };

  const expInfo = payloadObj && Object.hasOwn(payloadObj, "exp") ? formatJwtDate(payloadObj.exp) : null;
  const iatInfo = payloadObj && Object.hasOwn(payloadObj, "iat") ? formatJwtDate(payloadObj.iat) : null;
  const nbfInfo = payloadObj && Object.hasOwn(payloadObj, "nbf") ? formatJwtDate(payloadObj.nbf) : null;

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
            100% Private Client-Side JWT Debugger
          </h3>
          <p className="text-xs text-emerald-800">
            Tokens and secrets are processed locally. A valid signature does not validate the issuer, audience, expiry, or application permissions.
          </p>
        </div>
      </div>

      {/* Main Grid: Encoded Token vs Decoded Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Encoded Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Encoded Token (Raw JWT)</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setTokenInput(SAMPLE_JWT)}
                className="text-violet-600 hover:text-violet-700 font-medium px-2 py-0.5 rounded hover:bg-violet-50"
              >
                Sample
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setTokenInput("")}
                className="text-slate-500 hover:text-red-600 font-medium px-2 py-0.5 rounded hover:bg-slate-100"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={14}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your encoded JWT (header.payload.signature) here..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-800 shadow-inner focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Color legend guide */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-700">JWT Structure Color Code</h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-center">
              <div className="rounded-lg bg-rose-50 border border-rose-200 py-1.5 text-rose-700">
                1. Header
              </div>
              <div className="rounded-lg bg-violet-50 border border-violet-200 py-1.5 text-violet-700">
                2. Payload
              </div>
              <div className="rounded-lg bg-sky-50 border border-sky-200 py-1.5 text-sky-700">
                3. Signature
              </div>
            </div>
          </div>

          {/* Key Claims Summary Card */}
          {payloadObj && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="h-4 w-4 text-violet-600" />
                <span>Token Expiration & Timestamps</span>
              </div>

              <div className="space-y-2 text-xs">
                {expInfo && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                    <div>
                      <span className="font-semibold text-slate-700">Expiration (exp):</span>
                      <p className="text-[11px] text-slate-500">{expInfo.date}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        expInfo.isExpired
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {expInfo.isExpired ? `Expired (${expInfo.relative})` : `Valid (${expInfo.relative})`}
                    </span>
                  </div>
                )}

                {iatInfo && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                    <div>
                      <span className="font-semibold text-slate-700">Issued At (iat):</span>
                      <p className="text-[11px] text-slate-500">{iatInfo.date}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{iatInfo.relative}</span>
                  </div>
                )}

                {nbfInfo && (
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                    <div>
                      <span className="font-semibold text-slate-700">Not Before (nbf):</span>
                      <p className="text-[11px] text-slate-500">{nbfInfo.date}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{nbfInfo.relative}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Decoded Panels (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header Panel */}
          <div className="rounded-xl border border-rose-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Header: Algorithm & Token Type
                </span>
              </div>
              {headerJson && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(headerJson, "header")}
                  className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm hover:text-slate-900 border border-rose-200"
                >
                  {copiedSection === "header" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              )}
            </div>
            <pre className="p-4 font-mono text-xs text-rose-950 overflow-x-auto bg-white min-h-[70px]">
              {headerJson || "// Header will appear here"}
            </pre>
          </div>

          {/* Payload Panel */}
          <div className="rounded-xl border border-violet-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-xs font-bold text-violet-900 uppercase tracking-wider">
                  Payload: Data & Claims
                </span>
              </div>
              {payloadJson && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(payloadJson, "payload")}
                  className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm hover:text-slate-900 border border-violet-200"
                >
                  {copiedSection === "payload" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              )}
            </div>
            <pre className="p-4 font-mono text-xs text-violet-950 overflow-x-auto bg-white min-h-[140px] max-h-[350px]">
              {payloadJson || "// Payload claims will appear here"}
            </pre>
          </div>

          {/* Signature Verification Panel */}
          <div className="rounded-xl border border-sky-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                  Verify Signature (HMAC-SHA256)
                </span>
              </div>
              {signatureValid !== null && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    signatureValid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {signatureValid ? (
                    <>
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Signature Verified</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3 w-3 text-red-600" />
                      <span>Invalid Signature</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="p-4 space-y-3 bg-white">
              <div className="text-xs text-slate-600">
                Signature string in token:{" "}
                <code className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-sky-800 break-all">
                  {signatureStr || "None"}
                </code>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">
                  Secret Key for HMAC verification (Optional):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter secret key..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={verifySignature}
                    disabled={verifying || !signatureStr}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
                  >
                    {verifying ? "Checking..." : "Verify Secret"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

