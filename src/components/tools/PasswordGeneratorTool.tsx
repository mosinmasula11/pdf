"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";

// Curated list of common, clean, memorable words for passphrase generation
const WORD_LIST = [
  "acorn", "amber", "anchor", "anthem", "apple", "apron", "archer", "arrow", "atlas", "autumn",
  "badge", "bamboo", "banner", "beacon", "beetle", "breeze", "bridge", "bronze", "cabin", "cactus",
  "camera", "canyon", "carpet", "castle", "cedar", "cherry", "cipher", "circus", "cliff", "clover",
  "cobalt", "comet", "compass", "copper", "coral", "cradle", "crater", "cricket", "crystal", "dagger",
  "dancer", "delta", "desert", "diamond", "dolphin", "dragon", "eagle", "echo", "ember", "falcon",
  "feather", "fern", "finch", "flame", "forest", "fossil", "fox", "frost", "galaxy", "garden",
  "garnet", "gecko", "glacier", "glider", "globe", "granite", "griffin", "harbor", "haven", "hawk",
  "hazel", "helix", "horizon", "hound", "iceberg", "iguana", "island", "ivory", "jasper", "javelin",
  "jungle", "kelp", "kestrel", "knight", "lagoon", "lantern", "lark", "laurel", "legend", "lemon",
  "leopard", "lily", "lion", "lotus", "lunar", "magpie", "maple", "marble", "marsh", "meadow",
  "merlin", "meteor", "mirror", "monarch", "moss", "mountain", "nebula", "nest", "nickel", "nimbus",
  "ninja", "nova", "oasis", "ocean", "olive", "onyx", "opal", "orbit", "orca", "orchid",
  "otter", "owl", "palace", "panther", "parrot", "peak", "pebble", "pelican", "penguin", "phoenix",
  "pillar", "pine", "planet", "plaza", "polar", "prism", "pulsar", "quartz", "quiver", "rabbit",
  "radar", "raven", "reef", "rhino", "ridge", "ripple", "river", "robin", "rocket", "rose",
  "ruby", "saber", "sage", "sailor", "sapphire", "saturn", "scale", "scarlet", "scroll", "shadow",
  "shield", "shore", "siren", "slate", "solar", "spark", "sphinx", "spider", "spiral", "spring",
  "spruce", "star", "storm", "summit", "sunset", "swan", "talon", "temple", "thistle", "thorn",
  "thunder", "tiger", "timber", "titan", "topaz", "torrent", "tower", "trail", "tulip", "tunnel",
  "valley", "vapor", "velvet", "vessel", "viper", "volcano", "vortex", "walrus", "water", "wave",
  "whale", "willow", "winter", "wolf", "wombat", "zebra", "zenith", "zephyr"
];

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS_CHARS = "O0Il1|`'\"~,;:.<>{}[]()";

// Cryptographically secure random integer in range [0, max)
function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const maxSafe = Math.floor(0xffffffff / max) * max;
  let randomVal: number;
  do {
    crypto.getRandomValues(array);
    randomVal = array[0];
  } while (randomVal >= maxSafe);
  return randomVal % max;
}

export function PasswordGeneratorTool() {
  const [mode, setMode] = useState<"password" | "passphrase" | "pin">("password");

  // Standard Password Options
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  // Passphrase Options
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [includePassphraseNumber, setIncludePassphraseNumber] = useState(true);

  // PIN Options
  const [pinLength, setPinLength] = useState(6);

  // Output State
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkCopied, setBulkCopied] = useState(false);

  // Core generator algorithm
  const generateSinglePassword = useCallback((): string => {
    if (mode === "pin") {
      let pin = "";
      for (let i = 0; i < pinLength; i++) {
        pin += NUMBER_CHARS[getSecureRandomInt(NUMBER_CHARS.length)];
      }
      return pin;
    }

    if (mode === "passphrase") {
      const selectedWords: string[] = [];
      for (let i = 0; i < wordCount; i++) {
        let word = WORD_LIST[getSecureRandomInt(WORD_LIST.length)];
        if (capitalizeWords) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        selectedWords.push(word);
      }
      let result = selectedWords.join(separator);
      if (includePassphraseNumber) {
        const randNum = getSecureRandomInt(100);
        result += `${separator}${randNum}`;
      }
      return result;
    }

    // Standard password
    let upper = UPPERCASE_CHARS;
    let lower = LOWERCASE_CHARS;
    let numbers = NUMBER_CHARS;
    let symbols = SYMBOL_CHARS;

    if (excludeAmbiguous) {
      const filterAmbiguous = (str: string) =>
        str.split("").filter((c) => !AMBIGUOUS_CHARS.includes(c)).join("");
      upper = filterAmbiguous(upper);
      lower = filterAmbiguous(lower);
      numbers = filterAmbiguous(numbers);
      symbols = filterAmbiguous(symbols);
    }

    let charset = "";
    const mandatoryChars: string[] = [];

    if (includeUpper && upper.length > 0) {
      charset += upper;
      mandatoryChars.push(upper[getSecureRandomInt(upper.length)]);
    }
    if (includeLower && lower.length > 0) {
      charset += lower;
      mandatoryChars.push(lower[getSecureRandomInt(lower.length)]);
    }
    if (includeNumbers && numbers.length > 0) {
      charset += numbers;
      mandatoryChars.push(numbers[getSecureRandomInt(numbers.length)]);
    }
    if (includeSymbols && symbols.length > 0) {
      charset += symbols;
      mandatoryChars.push(symbols[getSecureRandomInt(symbols.length)]);
    }

    // Fallback if user unchecked all
    if (!charset) {
      charset = lower || LOWERCASE_CHARS;
    }

    const passwordArr: string[] = [...mandatoryChars];
    while (passwordArr.length < length) {
      passwordArr.push(charset[getSecureRandomInt(charset.length)]);
    }

    // Fisher-Yates CSPRNG shuffle
    for (let i = passwordArr.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
    }

    return passwordArr.slice(0, length).join("");
  }, [
    mode,
    length,
    includeUpper,
    includeLower,
    includeNumbers,
    includeSymbols,
    excludeAmbiguous,
    wordCount,
    separator,
    capitalizeWords,
    includePassphraseNumber,
    pinLength,
  ]);

  // Regenerate main password
  const regenerate = useCallback(() => {
    const pw = generateSinglePassword();
    setGeneratedPassword(pw);

    if (showBulk) {
      const list: string[] = [];
      for (let i = 0; i < 10; i++) {
        list.push(generateSinglePassword());
      }
      setBulkList(list);
    }
  }, [generateSinglePassword, showBulk]);

  // Initial and reactive generation
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Calculate Entropy & Strength
  const strengthInfo = useMemo(() => {
    if (!generatedPassword) {
      return { score: 0, label: "Empty", color: "bg-slate-200 text-slate-600", crackTime: "Instant" };
    }

    let poolSize = 0;
    if (mode === "pin") {
      poolSize = 10;
    } else if (mode === "passphrase") {
      poolSize = WORD_LIST.length;
    } else {
      if (/[A-Z]/.test(generatedPassword)) poolSize += 26;
      if (/[a-z]/.test(generatedPassword)) poolSize += 26;
      if (/[0-9]/.test(generatedPassword)) poolSize += 10;
      if (/[^A-Za-z0-9]/.test(generatedPassword)) poolSize += 30;
      if (poolSize === 0) poolSize = 26;
    }

    const entropy = Math.round(
      mode === "passphrase"
        ? (wordCount + (includePassphraseNumber ? 1 : 0)) * Math.log2(poolSize)
        : generatedPassword.length * Math.log2(poolSize)
    );

    if (entropy < 36) {
      return {
        entropy,
        score: 1,
        label: "Very Weak",
        color: "bg-rose-500",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        crackTime: "A few seconds",
      };
    }
    if (entropy < 55) {
      return {
        entropy,
        score: 2,
        label: "Weak",
        color: "bg-amber-500",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        crackTime: "A few hours",
      };
    }
    if (entropy < 75) {
      return {
        entropy,
        score: 3,
        label: "Good",
        color: "bg-yellow-500",
        badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
        crackTime: "Several months",
      };
    }
    if (entropy < 95) {
      return {
        entropy,
        score: 4,
        label: "Strong",
        color: "bg-emerald-500",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        crackTime: "Thousands of years",
      };
    }
    return {
      entropy,
      score: 5,
      label: "Very Strong",
      color: "bg-green-600",
      badgeColor: "bg-green-50 text-green-700 border-green-200",
      crackTime: "Millions of centuries",
    };
  }, [generatedPassword, mode, wordCount, includePassphraseNumber]);

  // Copy handler
  const handleCopy = async () => {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBulk = async () => {
    if (bulkList.length === 0) return;
    await navigator.clipboard.writeText(bulkList.join("\n"));
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2000);
  };

  const handleDownloadBulk = () => {
    if (bulkList.length === 0) return;
    const blob = new Blob([bulkList.join("\n")], { type: "text/plain" });
    downloadBlob(blob, `passwords-${Date.now()}.txt`);
  };

  return (
    <div className="space-y-8">
      {/* Privacy Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm font-medium">
          <strong className="font-semibold">100% Cryptographically Secure & Private:</strong> Passwords are generated directly on your device using the browser&apos;s Web Cryptography API (<code className="rounded bg-emerald-100 px-1 py-0.5 text-xs text-emerald-800">crypto.getRandomValues</code>). Your passwords are never transmitted over the internet.
        </p>
      </div>

      {/* Main Password Showcase */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Generated {mode === "pin" ? "PIN" : mode === "passphrase" ? "Passphrase" : "Password"}
            </span>
            <div className="mt-1 flex items-center gap-2 overflow-x-auto py-1">
              <span className="select-all font-mono text-2xl font-bold tracking-wider text-slate-800 sm:text-3xl">
                {generatedPassword || "Click Regenerate"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={regenerate}
              title="Generate new password"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 active:scale-95"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition active:scale-95 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Strength:</span>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-bold ${strengthInfo.badgeColor}`}
              >
                {strengthInfo.label} ({strengthInfo.entropy} bits)
              </span>
            </div>
            <span className="text-slate-500">
              Estimated crack time: <strong className="text-slate-700">{strengthInfo.crackTime}</strong>
            </span>
          </div>

          {/* Progress bar with 5 steps */}
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step <= strengthInfo.score ? strengthInfo.color : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1.5">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
            mode === "password"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <KeyRound className="h-4 w-4" /> Random Password
        </button>
        <button
          type="button"
          onClick={() => setMode("passphrase")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
            mode === "passphrase"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4" /> Memorable Passphrase
        </button>
        <button
          type="button"
          onClick={() => setMode("pin")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
            mode === "pin"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Lock className="h-4 w-4" /> Numeric PIN
        </button>
      </div>

      {/* Options Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {mode === "password" && (
          <div className="space-y-6">
            {/* Length Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="length-slider" className="text-sm font-semibold text-slate-800">
                  Password Length
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-violet-600">{length}</span>
                  <span className="text-xs text-slate-400">chars</span>
                </div>
              </div>
              <input
                id="length-slider"
                type="range"
                min={6}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="mt-3 w-full accent-violet-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>6 (Simple)</span>
                <span>16 (Recommended)</span>
                <span>32 (Ultra)</span>
                <span>64 (Max)</span>
              </div>
            </div>

            {/* Character Set Checkboxes */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Uppercase Letters</div>
                  <div className="text-xs text-slate-400">A B C D E F G</div>
                </div>
                <input
                  type="checkbox"
                  checked={includeUpper}
                  onChange={(e) => setIncludeUpper(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Lowercase Letters</div>
                  <div className="text-xs text-slate-400">a b c d e f g</div>
                </div>
                <input
                  type="checkbox"
                  checked={includeLower}
                  onChange={(e) => setIncludeLower(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Numbers</div>
                  <div className="text-xs text-slate-400">0 1 2 3 4 5 6 7 8 9</div>
                </div>
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Special Symbols</div>
                  <div className="text-xs text-slate-400">! @ # $ % ^ &amp; * ( ) _ +</div>
                </div>
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="col-span-1 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50 sm:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Exclude Ambiguous Characters</div>
                  <div className="text-xs text-slate-400">
                    Avoid easily confused characters like O, 0, l, 1, I, |, and punctuation brackets
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            </div>
          </div>
        )}

        {mode === "passphrase" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="word-count-slider" className="text-sm font-semibold text-slate-800">
                  Number of Words
                </label>
                <span className="font-mono text-lg font-bold text-violet-600">{wordCount} words</span>
              </div>
              <input
                id="word-count-slider"
                type="range"
                min={3}
                max={8}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="mt-3 w-full accent-violet-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>3 words (Simple)</span>
                <span>4 words (Recommended)</span>
                <span>8 words (Maximum security)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="separator-select" className="block text-xs font-semibold text-slate-700">
                  Word Separator
                </label>
                <select
                  id="separator-select"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value="_">Underscore (_)</option>
                  <option value=".">Dot (.)</option>
                  <option value=" ">Space ( )</option>
                  <option value="">None</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <span className="text-sm font-semibold text-slate-800">Capitalize Words</span>
                <input
                  type="checkbox"
                  checked={capitalizeWords}
                  onChange={(e) => setCapitalizeWords(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <span className="text-sm font-semibold text-slate-800">Append Number</span>
                <input
                  type="checkbox"
                  checked={includePassphraseNumber}
                  onChange={(e) => setIncludePassphraseNumber(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            </div>
          </div>
        )}

        {mode === "pin" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="pin-slider" className="text-sm font-semibold text-slate-800">
                  PIN Digits
                </label>
                <span className="font-mono text-lg font-bold text-violet-600">{pinLength} digits</span>
              </div>
              <input
                id="pin-slider"
                type="range"
                min={4}
                max={12}
                value={pinLength}
                onChange={(e) => setPinLength(Number(e.target.value))}
                className="mt-3 w-full accent-violet-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>4 digits (ATM standard)</span>
                <span>6 digits (Mobile standard)</span>
                <span>12 digits (High security)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Generator Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bulk Password List</h3>
            <p className="text-xs text-slate-500">
              Generate 10 independent passwords at once using current parameters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !showBulk;
              setShowBulk(next);
              if (next && bulkList.length === 0) {
                const list: string[] = [];
                for (let i = 0; i < 10; i++) {
                  list.push(generateSinglePassword());
                }
                setBulkList(list);
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {showBulk ? "Hide Bulk List" : "Show 10 Passwords"}
          </button>
        </div>

        {showBulk && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyBulk}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {bulkCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {bulkCopied ? "Copied All!" : "Copy All"}
              </button>
              <button
                type="button"
                onClick={handleDownloadBulk}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" /> Download (.txt)
              </button>
            </div>

            <div className="space-y-2">
              {bulkList.map((pw, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 font-mono text-sm font-medium text-slate-700 transition hover:bg-violet-50/50"
                >
                  <span className="truncate">{pw}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(pw);
                    }}
                    title="Copy this password"
                    className="ml-2 text-slate-400 hover:text-violet-600"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Best Practices */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600">
        <h4 className="font-bold text-slate-900">Tips for Strong Account Security</h4>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs text-slate-600">
          <li><strong>Never reuse passwords</strong> across multiple accounts. If one service is breached, all your accounts remain protected.</li>
          <li><strong>Use a Password Manager</strong> (like 1Password, Bitwarden, or Apple Keychain) to store unique, complex 16+ character passwords.</li>
          <li><strong>Enable Two-Factor Authentication (2FA)</strong> on critical accounts like email, banking, and social networks for an extra layer of defense.</li>
          <li><strong>Passphrases</strong> (e.g., 4 or 5 random words) are ideal for master passwords because they offer high mathematical entropy while remaining easy to remember.</li>
        </ul>
      </div>
    </div>
  );
}
