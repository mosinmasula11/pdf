"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  Percent,
  Copy,
  Check,
  TrendingUp,
  Tag,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export function PercentageCalculatorTool() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Card 1: What is X% of Y?
  const [c1Percent, setC1Percent] = useState<number>(15);
  const [c1Value, setC1Value] = useState<number>(250);
  const c1Result = (Number(c1Percent) * Number(c1Value)) / 100;

  // Card 2: X is what % of Y?
  const [c2Part, setC2Part] = useState<number>(45);
  const [c2Total, setC2Total] = useState<number>(180);
  const c2Result = Number(c2Total) !== 0 ? (Number(c2Part) / Number(c2Total)) * 100 : 0;

  // Card 3: % Increase / Decrease from X to Y
  const [c3From, setC3From] = useState<number>(80);
  const [c3To, setC3To] = useState<number>(120);
  const c3Diff = Number(c3To) - Number(c3From);
  const c3PercentChange = Number(c3From) !== 0 ? (c3Diff / Math.abs(Number(c3From))) * 100 : 0;
  const isIncrease = c3Diff >= 0;

  // Card 4: Discount Calculator
  const [originalPrice, setOriginalPrice] = useState<number>(1500);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const savings = (Number(originalPrice) * Number(discountPercent)) / 100;
  const finalPrice = Math.max(0, Number(originalPrice) - savings);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (isNaN(num)) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(decimals);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-3">
          <Percent className="w-3.5 h-3.5" />
          <span>All-in-One Percentage & Discount Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Percentage Calculator
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Solve any percentage problem instantly: find percentages of numbers, ratio percentages, percentage increases/decreases, and sale discounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: What is X% of Y? */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Calculator 1
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(formatNumber(c1Result), 1)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              What is <span className="text-violet-600 dark:text-violet-400">X%</span> of <span className="text-violet-600 dark:text-violet-400">Y</span>?
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">What is</span>
                <input
                  type="number"
                  value={c1Percent || ""}
                  onChange={(e) => setC1Percent(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                <span className="font-bold text-slate-600 dark:text-slate-400">%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">of</span>
                <input
                  type="number"
                  value={c1Value || ""}
                  onChange={(e) => setC1Value(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                <span className="font-bold text-slate-600 dark:text-slate-400">?</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Result:</span>
            <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
              {formatNumber(c1Result)}
            </div>
          </div>
        </div>

        {/* Card 2: X is what % of Y? */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Calculator 2
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(`${formatNumber(c2Result)}%`, 2)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              <span className="text-violet-600 dark:text-violet-400">X</span> is what percentage of <span className="text-violet-600 dark:text-violet-400">Y</span>?
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                value={c2Part || ""}
                onChange={(e) => setC2Part(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">is what % of</span>
              <input
                type="number"
                value={c2Total || ""}
                onChange={(e) => setC2Total(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
              <span className="font-bold text-slate-600 dark:text-slate-400">?</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Result:</span>
            <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
              {formatNumber(c2Result)}%
            </div>
          </div>
        </div>

        {/* Card 3: % Increase / Decrease */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Calculator 3
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(`${isIncrease ? "+" : ""}${formatNumber(c3PercentChange)}%`, 3)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 3 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Percentage Increase / Decrease
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">From</span>
              <input
                type="number"
                value={c3From || ""}
                onChange={(e) => setC3From(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">to</span>
              <input
                type="number"
                value={c3To || ""}
                onChange={(e) => setC3To(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isIncrease ? "Increase of" : "Decrease of"}:
            </span>
            <div
              className={`text-2xl font-black ${
                isIncrease ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncrease ? "+" : ""}
              {formatNumber(c3PercentChange)}%
            </div>
          </div>
        </div>

        {/* Card 4: Discount & Sale Price */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Calculator 4
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(formatNumber(finalPrice), 4)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 4 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Discount & Sale Price
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Original Price:</span>
                <input
                  type="number"
                  value={originalPrice || ""}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Discount:</span>
                <input
                  type="number"
                  value={discountPercent || ""}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                <span className="font-bold text-slate-600 dark:text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              You Save: <strong className="text-emerald-600">{formatNumber(savings)}</strong>
            </span>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block">Final Price</span>
              <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                {formatNumber(finalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

