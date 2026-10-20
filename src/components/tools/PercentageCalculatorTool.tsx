"use client";

import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function PercentageCalculatorTool() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { currency } = useCurrencyFormat();

  // Card 1: What is X% of Y?
  const [c1Percent, setC1Percent] = useState<number>(15);
  const [c1Value, setC1Value] = useState<number>(250);
  const c1Result = (Number(c1Percent) * Number(c1Value)) / 100;

  // Card 2: X is what % of Y?
  const [c2Part, setC2Part] = useState<number>(45);
  const [c2Total, setC2Total] = useState<number>(180);
  const c2Result = Number(c2Total) !== 0 ? (Number(c2Part) / Number(c2Total)) * 100 : NaN;

  // Card 3: % Increase / Decrease from X to Y
  const [c3From, setC3From] = useState<number>(80);
  const [c3To, setC3To] = useState<number>(120);
  const c3Diff = Number(c3To) - Number(c3From);
  const c3PercentChange = Number(c3From) !== 0 ? (c3Diff / Math.abs(Number(c3From))) * 100 : NaN;
  const isIncrease = c3Diff >= 0;

  // Card 4: Discount Calculator
  const [originalPrice, setOriginalPrice] = useState<number>(1500);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const savings = originalPrice >= 0 && discountPercent >= 0 && discountPercent <= 100 ? (Number(originalPrice) * Number(discountPercent)) / 100 : NaN;
  const validDiscount = originalPrice >= 0 && discountPercent >= 0 && discountPercent <= 100;
  const finalPrice = validDiscount ? Number(originalPrice) - savings : NaN;
  const validationError = !Number.isFinite(c2Result) ? "A percentage of a zero total is undefined." : !Number.isFinite(c3PercentChange) ? "Percentage change from zero is undefined." : !validDiscount ? "Price must be non-negative and discount must be between 0% and 100%." : "";

  const copyToClipboard = async (text: string, index: number) => {
    if (text.includes("Undefined")) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  const formatNumber = (num: number, decimals = 2) => Number.isFinite(num) ? new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: decimals }).format(num) : "Undefined";

  return (
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          Percentage Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Calculate percentages, relative changes and discounts.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: What is X% of Y? */}
        <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 ">
                Calculator 1
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(formatNumber(c1Result), 1)}
                className="text-xs text-slate-500 hover:text-slate-900  flex items-center gap-1"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900  mb-4">
              What is <span className="text-violet-600 ">X%</span> of <span className="text-violet-600 ">Y</span>?
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 ">What is</span>
<FormattedNumberInput
                  type="number"
                  aria-label="Percentage"
                  placeholder="Enter a value"
                  value={Number.isFinite(c1Percent) ? c1Percent : ""}
                  onChange={(e) => setC1Percent(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
                />
                <span className="font-bold text-slate-600 ">%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 ">of</span>
<FormattedNumberInput
                  type="number"
                  aria-label="Value"
                  placeholder="Enter a value"
                  value={Number.isFinite(c1Value) ? c1Value : ""}
                  onChange={(e) => setC1Value(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
                />
                <span className="font-bold text-slate-600 ">?</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100  flex items-center justify-between">
            <span className="text-xs text-slate-500">Result:</span>
            <div className="text-2xl font-black text-violet-600 ">
              {formatNumber(c1Result)}
            </div>
          </div>
        </div>

        {/* Card 2: X is what % of Y? */}
        <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 ">
                Calculator 2
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(`${formatNumber(c2Result)}%`, 2)}
                className="text-xs text-slate-500 hover:text-slate-900  flex items-center gap-1"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900  mb-4">
              <span className="text-violet-600 ">X</span> is what percentage of <span className="text-violet-600 ">Y</span>?
            </h2>

            <div className="flex flex-wrap items-center gap-3">
<FormattedNumberInput
                type="number"
                aria-label="Part"
                  placeholder="Enter a value"
                  value={Number.isFinite(c2Part) ? c2Part : ""}
                onChange={(e) => setC2Part(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-sm font-semibold text-slate-600 ">is what % of</span>
<FormattedNumberInput
                type="number"
                aria-label="Total"
                  placeholder="Enter a value"
                  value={Number.isFinite(c2Total) ? c2Total : ""}
                onChange={(e) => setC2Total(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
              <span className="font-bold text-slate-600 ">?</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100  flex items-center justify-between">
            <span className="text-xs text-slate-500">Result:</span>
            <div className="text-2xl font-black text-violet-600 ">
              {formatNumber(c2Result)}%
            </div>
          </div>
        </div>

        {/* Card 3: % Increase / Decrease */}
        <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 ">
                Calculator 3
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(`${isIncrease ? "+" : ""}${formatNumber(c3PercentChange)}%`, 3)}
                className="text-xs text-slate-500 hover:text-slate-900  flex items-center gap-1"
              >
                {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 3 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900  mb-4">
              Percentage Increase / Decrease
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-600 ">From</span>
<FormattedNumberInput
                type="number"
                aria-label="Original value"
                  placeholder="Enter a value"
                  value={Number.isFinite(c3From) ? c3From : ""}
                onChange={(e) => setC3From(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-sm font-semibold text-slate-600 ">to</span>
<FormattedNumberInput
                type="number"
                aria-label="New value"
                  placeholder="Enter a value"
                  value={Number.isFinite(c3To) ? c3To : ""}
                onChange={(e) => setC3To(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100  flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isIncrease ? "Increase of" : "Decrease of"}:
            </span>
            <div
              className={`text-2xl font-black ${
                isIncrease ? "text-emerald-600 " : "text-rose-600 "
              }`}
            >
              {isIncrease ? "+" : ""}
              {formatNumber(c3PercentChange)}%
            </div>
          </div>
        </div>

        {/* Card 4: Discount & Sale Price */}
        <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 ">
                Calculator 4
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(formatNumber(finalPrice), 4)}
                className="text-xs text-slate-500 hover:text-slate-900  flex items-center gap-1"
              >
                {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 4 ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900  mb-4">
              Discount & Sale Price
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 ">Original Price:</span>
<FormattedNumberInput
                  type="number"
                  aria-label="Original price"
                  placeholder="Enter a value"
                  value={Number.isFinite(originalPrice) ? originalPrice : ""}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-600 ">Discount:</span>
<FormattedNumberInput
                  type="number"
                  aria-label="Discount percentage"
                  placeholder="Enter a value"
                  value={Number.isFinite(discountPercent) ? discountPercent : ""}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-md border border-slate-200  bg-slate-50  font-bold text-center text-slate-900  focus:ring-2 focus:ring-violet-500"
                />
                <span className="font-bold text-slate-600 ">%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100  flex items-center justify-between">
            <span className="text-xs text-slate-500">
              You Save: <strong className="text-emerald-600">{formatNumber(savings)}</strong>
            </span>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block">Final Price</span>
              <span className="text-2xl font-black text-violet-600 ">
                {formatNumber(finalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

