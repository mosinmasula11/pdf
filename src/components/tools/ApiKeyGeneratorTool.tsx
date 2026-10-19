"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  FileCode,
  FileText,
  Key,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";

type KeyType = "apikey" | "uuid" | "jwt" | "nanoid" | "hex";

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE64URL_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const HEX_CHARS = "0123456789abcdef";
const PREFIX_TEMPLATES: Record<string, string> = { stripe_sec: "sk_live_", stripe_pub: "pk_live_", github: "ghp_", openai: "sk-proj-", aws: "AKIA" };

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function generateRandomString(length: number, charset: string): string {
  const result: string[] = [];
  const charsetLength = charset.length;
  // Use rejection sampling to eliminate modulo bias
  const maxSafe = Math.floor(256 / charsetLength) * charsetLength;
  while (result.length < length) {
    const bytes = getRandomBytes(Math.max(length * 2, 32));
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      if (bytes[i] < maxSafe) {
        result.push(charset[bytes[i] % charsetLength]);
      }
    }
  }
  return result.join("");
}

export function ApiKeyGeneratorTool() {
  const [keyType, setKeyType] = useState<KeyType>("apikey");
  const [quantity, setQuantity] = useState(5);

  // API Key Options
  const [prefixPreset, setPrefixPreset] = useState("custom");
  const [customPrefix, setCustomPrefix] = useState("sk_live_");
  const [keyLength, setKeyLength] = useState(32);
  const [encoding, setEncoding] = useState<"base62" | "base64url" | "hex" | "upper">("base62");

  // UUID Options
  const [uuidFormat, setUuidFormat] = useState<"standard" | "uppercase" | "nohyphen">("standard");

  // JWT Secret Options
  const [jwtBits, setJwtBits] = useState<256 | 384 | 512>(256);
  const [jwtEncoding, setJwtEncoding] = useState<"hex" | "base64" | "base64url">("hex");

  // NanoID Options
  const [nanoIdLength, setNanoIdLength] = useState(21);

  // Hex Token Options
  const [hexBytes, setHexBytes] = useState(32);

  // Output
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [envVarName, setEnvVarName] = useState("API_KEY");
  const validEnvName = /^[A-Z_][A-Z0-9_]*$/.test(envVarName);

  // Generate single token based on active mode
  const generateSingleKey = useCallback((): string => {
    switch (keyType) {
      case "apikey": {
        let prefix = customPrefix;
        if (prefixPreset === "stripe_sec") prefix = "sk_live_";
        else if (prefixPreset === "stripe_pub") prefix = "pk_live_";
        else if (prefixPreset === "github") prefix = "ghp_";
        else if (prefixPreset === "openai") prefix = "sk-proj-";
        else if (prefixPreset === "aws") prefix = "AKIA";

        let charset = BASE62_CHARS;
        if (encoding === "base64url") charset = BASE64URL_CHARS;
        else if (encoding === "hex") charset = HEX_CHARS;
        else if (encoding === "upper") charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        const randomPart = generateRandomString(keyLength, charset);
        return `${prefix}${randomPart}`;
      }

      case "uuid": {
        // RFC4122 v4 UUID
        let uuid = crypto.randomUUID();
        if (uuidFormat === "uppercase") uuid = uuid.toUpperCase();
        else if (uuidFormat === "nohyphen") uuid = uuid.replace(/-/g, "");
        return uuid;
      }

      case "jwt": {
        const bytes = getRandomBytes(jwtBits / 8);
        if (jwtEncoding === "hex") {
          return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        } else if (jwtEncoding === "base64") {
          return btoa(String.fromCharCode(...bytes));
        } else {
          // base64url
          return btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        }
      }

      case "nanoid": {
        return generateRandomString(nanoIdLength, BASE64URL_CHARS);
      }

      case "hex": {
        const bytes = getRandomBytes(hexBytes);
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
    }
  }, [
    keyType,
    prefixPreset,
    customPrefix,
    keyLength,
    encoding,
    uuidFormat,
    jwtBits,
    jwtEncoding,
    nanoIdLength,
    hexBytes,
  ]);

  // Generate batch
  const generateBatch = useCallback(() => {
    const list: string[] = [];
    for (let i = 0; i < quantity; i++) {
      list.push(generateSingleKey());
    }
    setGeneratedKeys(list);
  }, [generateSingleKey, quantity]);

  // Generate on load & reactive updates
  useEffect(() => {
    generateBatch();
  }, [generateBatch]);

  // Copy single
  const handleCopyOne = async (val: string, index: number) => {
    await navigator.clipboard.writeText(val);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  // Copy all
  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(generatedKeys.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Download .env format
  const handleDownloadEnv = () => {
    if (!validEnvName) return;
    const lines = generatedKeys.map((k, i) =>
      generatedKeys.length === 1 ? `${envVarName}=${k}` : `${envVarName}_${i + 1}=${k}`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    downloadBlob(blob, `${envVarName.toLowerCase()}-${Date.now()}.env`);
  };

  // Download .txt format
  const handleDownloadTxt = () => {
    const blob = new Blob([generatedKeys.join("\n")], { type: "text/plain" });
    downloadBlob(blob, `keys-${Date.now()}.txt`);
  };

  return (
    <div className="space-y-8">
      {/* Privacy Notice */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm font-medium">
          <strong className="font-semibold">Cryptographically Secure &amp; Zero Network Leaks:</strong> All tokens and keys are generated directly inside your browser using the Web Cryptography API (<code className="rounded bg-emerald-100 px-1 py-0.5 text-xs text-emerald-800">crypto.getRandomValues</code>). Your keys are never transmitted over the internet or saved to any database.
        </p>
      </div>

      {/* Format Selection Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5">
        {[
          { id: "apikey", label: "API Key (Prefix + Token)", icon: Key },
          { id: "uuid", label: "UUID / GUID (v4)", icon: Sparkles },
          { id: "jwt", label: "JWT / HMAC Secret", icon: ShieldCheck },
          { id: "nanoid", label: "NanoID (Short ID)", icon: FileCode },
          { id: "hex", label: "Cryptographic Hex", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setKeyType(tab.id as KeyType);
                if (tab.id === "jwt") setEnvVarName("JWT_SECRET");
                else if (tab.id === "apikey") setEnvVarName("API_KEY");
                else if (tab.id === "uuid") setEnvVarName("TOKEN_UUID");
                else setEnvVarName("SECRET_KEY");
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-semibold transition ${
                keyType === tab.id
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Configuration Options Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">Key Parameters</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Quantity:</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
            >
              <option value={1}>1 Key</option>
              <option value={5}>5 Keys</option>
              <option value={10}>10 Keys</option>
              <option value={20}>20 Keys</option>
              <option value={50}>50 Keys</option>
            </select>
          </div>
        </div>

        {/* 1. API KEY OPTIONS */}
        {keyType === "apikey" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Prefix Template
              </label>
              <select
                value={prefixPreset}
                onChange={(e) => {
                  setPrefixPreset(e.target.value);
                  if (e.target.value === "stripe_sec") setCustomPrefix("sk_live_");
                  else if (e.target.value === "stripe_pub") setCustomPrefix("pk_live_");
                  else if (e.target.value === "github") setCustomPrefix("ghp_");
                  else if (e.target.value === "openai") setCustomPrefix("sk-proj-");
                  else if (e.target.value === "aws") setCustomPrefix("AKIA");
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500"
              >
                <option value="custom">Custom Prefix</option>
                <option value="stripe_sec">Stripe Secret (sk_live_...)</option>
                <option value="stripe_pub">Stripe Publishable (pk_live_...)</option>
                <option value="github">GitHub Personal Token (ghp_...)</option>
                <option value="openai">OpenAI Secret (sk-proj-...)</option>
                <option value="aws">AWS Access Key (AKIA...)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom Prefix String
              </label>
              <input
                type="text"
                value={PREFIX_TEMPLATES[prefixPreset] ?? customPrefix}
                disabled={prefixPreset !== "custom"}
                onChange={(e) => setCustomPrefix(e.target.value.replace(/[^A-Za-z0-9_.-]/g, ""))}
                placeholder="e.g. app_secret_"
                title="Use letters, numbers, dots, underscores, or hyphens."
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Random Part Character Set
              </label>
              <select
                value={encoding}
                onChange={(e) => setEncoding(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500"
              >
                <option value="base62">Base62 (Alphanumeric a-z, A-Z, 0-9)</option>
                <option value="base64url">Base64URL Safe (a-z, A-Z, 0-9, -, _)</option>
                <option value="hex">Hexadecimal (0-9, a-f)</option>
                <option value="upper">Uppercase Alphanumeric (A-Z, 0-9)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Random Token Length: <strong className="text-violet-600">{keyLength} chars</strong></span>
                <span className="text-slate-400">Total length: {(PREFIX_TEMPLATES[prefixPreset] ?? customPrefix).length + keyLength} chars</span>
              </div>
              <input
                type="range"
                min={16}
                max={64}
                value={keyLength}
                onChange={(e) => setKeyLength(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>
          </div>
        )}

        {/* 2. UUID OPTIONS */}
        {keyType === "uuid" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { id: "standard", label: "Standard Hyphenated", desc: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" },
              { id: "uppercase", label: "Uppercase", desc: "XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX" },
              { id: "nohyphen", label: "Compact (No Hyphens)", desc: "32 hex characters without dashes" },
            ].map((fmt) => (
              <label
                key={fmt.id}
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition ${
                  uuidFormat === fmt.id
                    ? "border-violet-500 bg-violet-50/40"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{fmt.label}</span>
                  <input
                    type="radio"
                    name="uuidFormat"
                    checked={uuidFormat === fmt.id}
                    onChange={() => setUuidFormat(fmt.id as any)}
                    className="h-4 w-4 text-violet-600"
                  />
                </div>
                <span className="mt-1 text-[11px] text-slate-400">{fmt.desc}</span>
              </label>
            ))}
          </div>
        )}

        {/* 3. JWT SECRET OPTIONS */}
        {keyType === "jwt" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Key Strength / Entropy
              </label>
              <select
                value={jwtBits}
                onChange={(e) => setJwtBits(Number(e.target.value) as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500"
              >
                <option value={256}>256-bit (32 bytes) — HS256 Standard</option>
                <option value={384}>384-bit (48 bytes) — HS384 High Security</option>
                <option value={512}>512-bit (64 bytes) — HS512 Maximum Security</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Encoding
              </label>
              <select
                value={jwtEncoding}
                onChange={(e) => setJwtEncoding(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500"
              >
                <option value="hex">Hexadecimal (0-9a-f)</option>
                <option value="base64">Base64</option>
                <option value="base64url">Base64URL Safe</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. NANOID OPTIONS */}
        {keyType === "nanoid" && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>NanoID Length: <strong className="text-violet-600">{nanoIdLength} characters</strong></span>
              <span className="text-slate-400">Default: 21 chars (~4 trillion years collision resistance)</span>
            </div>
            <input
              type="range"
              min={8}
              max={36}
              value={nanoIdLength}
              onChange={(e) => setNanoIdLength(Number(e.target.value))}
              className="w-full accent-violet-600"
            />
          </div>
        )}

        {/* 5. HEX TOKEN OPTIONS */}
        {keyType === "hex" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { bytes: 16, label: "16 Bytes (128-bit)", chars: "32 hex characters" },
              { bytes: 32, label: "32 Bytes (256-bit)", chars: "64 hex characters (Recommended)" },
              { bytes: 64, label: "64 Bytes (512-bit)", chars: "128 hex characters (High security)" },
            ].map((h) => (
              <label
                key={h.bytes}
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition ${
                  hexBytes === h.bytes
                    ? "border-violet-500 bg-violet-50/40"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{h.label}</span>
                  <input
                    type="radio"
                    name="hexBytes"
                    checked={hexBytes === h.bytes}
                    onChange={() => setHexBytes(h.bytes)}
                    className="h-4 w-4 text-violet-600"
                  />
                </div>
                <span className="mt-1 text-[11px] text-slate-400">{h.chars}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generateBatch}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" /> Generate New
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copiedAll ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copiedAll ? "Copied All!" : "Copy All"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={envVarName}
            onChange={(e) => setEnvVarName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            placeholder="ENV_VAR_NAME"
            title="Environment variable prefix for .env export"
            className="w-28 sm:w-36 rounded-xl border border-slate-200 bg-white px-2.5 py-2 font-mono text-xs text-slate-800 outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={handleDownloadEnv}
            disabled={!validEnvName || !generatedKeys.length}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title="Download formatted for .env file"
          >
            <FileCode className="h-3.5 w-3.5 text-violet-600" /> .env
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title="Download as plain text list"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" /> .txt
          </button>
        </div>
      </div>

      {!validEnvName && <p role="alert" className="text-sm text-rose-700">Use an environment variable name starting with a letter or underscore.</p>}
      <p className="text-xs text-slate-500">Provider prefixes are examples only. These random strings do not create active credentials with Stripe, GitHub, OpenAI, or AWS.</p>
      {/* Generated Output List */}
      <div className="space-y-2.5">
        {generatedKeys.map((item, idx) => (
          <div
            key={idx}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-violet-300 hover:shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-[11px] font-bold text-slate-500">
                {idx + 1}
              </span>
              <span className="select-all truncate font-mono text-xs sm:text-sm font-semibold text-slate-800">
                {item}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopyOne(item, idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                copiedIndex === idx
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-violet-100 hover:text-violet-700"
              }`}
            >
              {copiedIndex === idx ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Developer Best Practices Guide */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 text-sm">Security Best Practices for API Keys &amp; Secrets</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Never commit secrets to Git:</strong> Always store sensitive tokens in a private <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800">.env.local</code> file and add it to your <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800">.gitignore</code>.</li>
          <li><strong>Use recognizable prefixes:</strong> Prefixes like <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800">sk_live_</code> or <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800">pk_test_</code> allow automated secret scanners (like GitHub Secret Scanning) to alert you if a key is ever leaked publicly.</li>
          <li><strong>HMAC &amp; JWT Signatures:</strong> Use at least 256 bits (32 bytes) of random entropy for HS256 tokens to prevent brute-force signature forgery.</li>
        </ul>
      </div>
    </div>
  );
}
