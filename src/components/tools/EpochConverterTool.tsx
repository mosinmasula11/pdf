"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Copy,
  Check,
  Play,
  Pause,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";

export function EpochConverterTool() {
  // Current live epoch states
  const [currentEpochMs, setCurrentEpochMs] = useState<number | null>(null);
  const [isLivePaused, setIsLivePaused] = useState<boolean>(false);
  const [displayUnit, setDisplayUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Epoch to Date converter states
  const [epochInput, setEpochInput] = useState<string>("");
  const [epochResult, setEpochResult] = useState<{
    local: string;
    utc: string;
    iso: string;
    relative: string;
    dayOfYear: number;
    dayOfWeek: string;
    isLeapYear: boolean;
  } | null>(null);

  // Date to Epoch converter states
  const [dateInput, setDateInput] = useState<string>("");
  const [timeInput, setTimeInput] = useState<string>("");
  const [dateTz, setDateTz] = useState<"local" | "utc">("local");

  const [dateResult, setDateResult] = useState<{
    seconds: number;
    milliseconds: number;
  } | null>(null);

  // Initialize on mount
  useEffect(() => {
    const now = new Date();
    const ms = now.getTime();
    setCurrentEpochMs(ms);
    setDateInput(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    setTimeInput(now.toTimeString().slice(0, 8));
    setEpochInput(Math.floor(ms / 1000).toString());
  }, []);

  // Live Clock Interval
  useEffect(() => {
    if (isLivePaused) return;
    const interval = setInterval(() => {
      setCurrentEpochMs(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [isLivePaused]);

  // Compute Epoch to Date whenever epochInput changes
  useEffect(() => {
    const trimmed = epochInput.trim();
    if (!trimmed) {
      setEpochResult(null);
      return;
    }

    const num = Number(trimmed);
    if (isNaN(num)) {
      setEpochResult(null);
      return;
    }

    // Auto-detect if user entered seconds (~10 digits) or milliseconds (~13 digits)
    const ms = Math.abs(num) < 1e11 ? num * 1000 : num;
    const date = new Date(ms);

    if (isNaN(date.getTime())) {
      setEpochResult(null);
      return;
    }

    // Calculate Relative time
    const nowMs = currentEpochMs ?? date.getTime();
    const diffSec = Math.round((date.getTime() - nowMs) / 1000);
    const absDiff = Math.abs(diffSec);
    let relative = "";
    if (absDiff < 60) {
      relative = diffSec < 0 ? `${absDiff} seconds ago` : `in ${absDiff} seconds`;
    } else if (absDiff < 3600) {
      const mins = Math.floor(absDiff / 60);
      relative = diffSec < 0 ? `${mins} minutes ago` : `in ${mins} minutes`;
    } else if (absDiff < 86400) {
      const hrs = Math.floor(absDiff / 3600);
      relative = diffSec < 0 ? `${hrs} hours ago` : `in ${hrs} hours`;
    } else {
      const days = Math.floor(absDiff / 86400);
      relative = diffSec < 0 ? `${days} days ago` : `in ${days} days`;
    }

    // Day of year
    const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 1)) / 86400000) + 1;

    // Day of week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = days[date.getDay()];

    // Leap year
    const year = date.getFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    setEpochResult({
      local: date.toString(),
      utc: date.toUTCString(),
      iso: date.toISOString(),
      relative,
      dayOfYear,
      dayOfWeek,
      isLeapYear,
    });
  }, [epochInput, currentEpochMs]);

  // Compute Date to Epoch whenever date, time or dateTz changes
  useEffect(() => {
    try {
      let d: Date;
      if (dateTz === "utc") {
        d = new Date(`${dateInput}T${timeInput}Z`);
      } else {
        d = new Date(`${dateInput}T${timeInput}`);
      }

      if (!isNaN(d.getTime())) {
        setDateResult({
          seconds: Math.floor(d.getTime() / 1000),
          milliseconds: d.getTime(),
        });
      } else {
        setDateResult(null);
      }
    } catch {
      setDateResult(null);
    }
  }, [dateInput, timeInput, dateTz]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentSeconds = currentEpochMs !== null ? Math.floor(currentEpochMs / 1000) : 0;
  const currentFormattedDisplay =
    currentEpochMs !== null
      ? displayUnit === "seconds"
        ? currentSeconds.toString()
        : currentEpochMs.toString()
      : "—";

  const liveDate = currentEpochMs !== null ? new Date(currentEpochMs) : null;

  return (
    <div className="space-y-6">
      {/* 1. Live Current Unix Timestamp Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isLivePaused ? "bg-amber-400" : "animate-ping bg-emerald-400"
                  }`}
                />
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    isLivePaused ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                {isLivePaused ? "Current Unix Timestamp (Paused)" : "Live Current Unix Timestamp"}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl sm:text-5xl font-black tracking-tight text-white select-all">
                {currentFormattedDisplay}
              </span>
              <span className="text-xs font-semibold uppercase text-violet-300">
                {displayUnit === "seconds" ? "sec" : "ms"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-violet-200/80 pt-1">
              <span>
                <strong className="text-white">UTC:</strong> {liveDate ? liveDate.toUTCString() : "—"}
              </span>
              <span>•</span>
              <span>
                <strong className="text-white">Local:</strong> {liveDate ? liveDate.toLocaleTimeString() : "—"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => copyText(currentFormattedDisplay, "live")}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition border border-white/10"
            >
              {copiedKey === "live" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Timestamp</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsLivePaused((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition border border-white/10"
              title={isLivePaused ? "Resume live ticking" : "Pause live ticking"}
            >
              {isLivePaused ? <Play className="h-4 w-4 text-emerald-400" /> : <Pause className="h-4 w-4 text-amber-300" />}
              <span>{isLivePaused ? "Resume" : "Pause"}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setDisplayUnit((prev) => (prev === "seconds" ? "milliseconds" : "seconds"))
              }
              className="flex items-center gap-1.5 rounded-xl bg-violet-600/60 px-3 py-2 text-xs font-medium text-white hover:bg-violet-600 transition border border-violet-400/30"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Switch to {displayUnit === "seconds" ? "ms" : "seconds"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Converters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box A: Convert Epoch to Human Date */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Epoch Timestamp → Human Date</h3>
            </div>
            <button
              type="button"
              onClick={() => setEpochInput(currentSeconds.toString())}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg"
            >
              Set to Now
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Enter Timestamp (Seconds or Milliseconds)</label>
            <input
              type="text"
              value={epochInput}
              onChange={(e) => setEpochInput(e.target.value)}
              placeholder="e.g. 1773934500"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                setEpochInput(Math.floor(d.getTime() / 1000).toString());
              }}
              className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
            >
              Start of Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                setEpochInput(Math.floor(d.getTime() / 1000).toString());
              }}
              className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
            >
              +1 Day
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                setEpochInput(Math.floor(d.getTime() / 1000).toString());
              }}
              className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
            >
              +1 Week
            </button>
          </div>

          {/* Computed Results */}
          {epochResult ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Relative:</span>
                <span className="font-bold text-violet-700">{epochResult.relative}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">GMT / UTC:</span>
                  <button
                    type="button"
                    onClick={() => copyText(epochResult.utc, "utc")}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {copiedKey === "utc" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 break-all">
                  {epochResult.utc}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Your Local Time:</span>
                  <button
                    type="button"
                    onClick={() => copyText(epochResult.local, "local")}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {copiedKey === "local" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 break-all">
                  {epochResult.local}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">ISO 8601:</span>
                  <button
                    type="button"
                    onClick={() => copyText(epochResult.iso, "iso")}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {copiedKey === "iso" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                  {epochResult.iso}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-500">
                <div>
                  Day: <strong className="text-slate-800">{epochResult.dayOfWeek}</strong>
                </div>
                <div>
                  Day #{epochResult.dayOfYear} of {epochResult.isLeapYear ? 366 : 365}
                </div>
                <div>
                  {epochResult.isLeapYear ? "Leap Year" : "Regular Year"}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Enter a valid numeric epoch timestamp above to see human date details.
            </div>
          )}
        </div>

        {/* Box B: Convert Human Date to Epoch */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Human Date → Epoch Timestamp</h3>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setDateTz("local")}
                className={`px-2 py-0.5 rounded font-medium ${
                  dateTz === "local" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Local Time
              </button>
              <button
                type="button"
                onClick={() => setDateTz("utc")}
                className={`px-2 py-0.5 rounded font-medium ${
                  dateTz === "utc" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                UTC
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Time (HH:MM:SS)</label>
              <input
                type="time"
                step="1"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick set current time button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setDateInput(d.toISOString().slice(0, 10));
                setTimeInput(d.toTimeString().slice(0, 8));
              }}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              Reset to Current Time
            </button>
          </div>

          {/* Generated Timestamps */}
          {dateResult && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Epoch in Seconds:</span>
                  <button
                    type="button"
                    onClick={() => copyText(dateResult.seconds.toString(), "secRes")}
                    className="flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-medium"
                  >
                    {copiedKey === "secRes" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>Copy Seconds</span>
                  </button>
                </div>
                <div className="font-mono text-base font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>{dateResult.seconds}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Epoch in Milliseconds:</span>
                  <button
                    type="button"
                    onClick={() => copyText(dateResult.milliseconds.toString(), "msRes")}
                    className="flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-medium"
                  >
                    {copiedKey === "msRes" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>Copy Milliseconds</span>
                  </button>
                </div>
                <div className="font-mono text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                  <span>{dateResult.milliseconds}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Developer Epoch Reference Cheat Sheet */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-violet-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Unix Epoch Reference Durations
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="text-slate-500 text-[11px]">1 Minute</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">60s</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="text-slate-500 text-[11px]">1 Hour</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">3,600s</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="text-slate-500 text-[11px]">1 Day</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">86,400s</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="text-slate-500 text-[11px]">1 Week</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">604,800s</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="text-slate-500 text-[11px]">1 Month (30d)</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">2,592,000s</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="text-slate-500 text-[11px]">1 Year (365d)</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">31,536,000s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

