"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Briefcase,
  Copy,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Sun,
} from "lucide-react";

export function DateCalculatorTool() {
  const startDateId = useId();
  const endDateId = useId();
  const baseDateId = useId();

  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"difference" | "addSubtract">("difference");

  // Difference Mode
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(true);

  // Add / Subtract Mode
  const [baseDate, setBaseDate] = useState<string>("");
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState<number>(30);
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 30);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    setStartDate(fmt(today));
    setEndDate(fmt(future));
    setBaseDate(fmt(today));
    setReady(true);
  }, []);

  // Compute Difference
  let totalDays = 0;
  let businessDays = 0;
  let weekendDays = 0;
  let weeksCount = 0;
  let monthsCount = 0;
  let yearsCount = 0;

  if (ready && startDate && endDate) {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const minD = d1 <= d2 ? d1 : d2;
    const maxD = d1 <= d2 ? d2 : d1;

    let cur = new Date(minD);
    let count = 0;
    let biz = 0;
    let weekends = 0;

    while (cur < maxD || (includeEndDay && cur.getTime() === maxD.getTime())) {
      count++;
      const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
      if (day === 0 || day === 6) {
        weekends++;
      } else {
        biz++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    totalDays = count;
    businessDays = biz;
    weekendDays = weekends;
    weeksCount = Number((totalDays / 7).toFixed(1));
    monthsCount = Number((totalDays / 30.4375).toFixed(1));
    yearsCount = Number((totalDays / 365.25).toFixed(2));
  }

  // Compute Add/Subtract
  let targetDateString = "";
  let targetDayOfWeek = "";

  if (ready && baseDate) {
    const target = new Date(baseDate);
    const multiplier = operation === "add" ? 1 : -1;
    const delta = Number(amount) || 0;

    if (unit === "days") {
      target.setDate(target.getDate() + delta * multiplier);
    } else if (unit === "weeks") {
      target.setDate(target.getDate() + delta * 7 * multiplier);
    } else if (unit === "months") {
      target.setMonth(target.getMonth() + delta * multiplier);
    } else if (unit === "years") {
      target.setFullYear(target.getFullYear() + delta * multiplier);
    }

    targetDateString = target.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    targetDayOfWeek = target.toLocaleDateString("en-US", { weekday: "long" });
  }

  const copyResult = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>Accurate Business & Calendar Days</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Date & Day Difference Calculator
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Calculate exact duration between two dates (calendar days & working business days), or add/subtract days from any date.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="max-w-md mx-auto mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("difference")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "difference"
              ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Days Between Dates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("addSubtract")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "addSubtract"
              ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Add / Subtract Days
        </button>
      </div>

      {/* Tab 1: Days Between Dates */}
      {activeTab === "difference" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Select Start and End Dates
            </h2>

            <div>
              <label htmlFor={startDateId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Start Date
              </label>
              <input
                id={startDateId}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor={endDateId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                End Date
              </label>
              <input
                id={endDateId}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                id="includeEndDay"
                checked={includeEndDay}
                onChange={(e) => setIncludeEndDay(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 accent-violet-600"
              />
              <label htmlFor="includeEndDay" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Include end day in calculation (adds 1 day)
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Duration Summary
              </h2>
              <button
                type="button"
                onClick={() => copyResult(`${totalDays} days (${businessDays} working days)`)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Days
              </span>
              <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mt-1">
                {totalDays} <span className="text-xl font-normal text-slate-600">days</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-400 block mb-1">💼 Business Days (Mon-Fri)</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{businessDays} days</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-400 block mb-1">🏖 Weekend Days</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{weekendDays} days</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-400 block mb-1">📅 Total Weeks</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{weeksCount} weeks</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-400 block mb-1">🗓 Approx Months</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{monthsCount} months</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Add / Subtract Days */}
      {activeTab === "addSubtract" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Start Date & Offset
            </h2>

            <div>
              <label htmlFor={baseDateId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Starting Date
              </label>
              <input
                id={baseDateId}
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Operation
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOperation("add")}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    operation === "add"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperation("subtract")}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    operation === "subtract"
                      ? "bg-white dark:bg-slate-900 text-rose-600 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Subtract (-)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "days" | "weeks" | "months" | "years")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Calculated Date
              </h2>
              <button
                type="button"
                onClick={() => copyResult(targetDateString)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Date
              </span>
              <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-2">
                {targetDateString}
              </div>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                {targetDayOfWeek}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

