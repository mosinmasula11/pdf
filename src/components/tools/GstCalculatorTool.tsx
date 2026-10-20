"use client";

import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

import { useState, useId } from "react";
import Link from "next/link";
import { gstBreakdown } from "@/lib/extended-calculators";
import { Percent, Copy, Check, FileSpreadsheet, Coins, ShieldCheck, Building2 } from "lucide-react";

export function GstCalculatorTool() {
  const amountInputId = useId();
  const customRateInputId = useId();

  const [calcType, setCalcType] = useState<"exclusive" | "inclusive">("exclusive");
  const [amount, setAmount] = useState<number>(10000);
  const [rate, setRate] = useState<number>(18);
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [customRate, setCustomRate] = useState<number>(18);
  const [copied, setCopied] = useState(false);

  const selectedRate = isCustomRate ? customRate : rate;

  let validationError="";
  let projection={baseAmount:0,gstAmount:0,totalAmount:0};
  try{projection=gstBreakdown(amount,selectedRate,calcType);}catch(error){validationError=error instanceof Error?error.message:"Check the amount and rate.";}
  const {baseAmount,gstAmount,totalAmount}=projection;
  const validRate=selectedRate;

  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const igstAmount = gstAmount;

  const { money } = useCurrencyFormat(true);
  const formatRupee = (value: number) => money(value, 2);

  const handleCopySummary = async () => {
    if (validationError) return;
    const summary = `GST Calculation Summary:
Type: GST ${calcType === "exclusive" ? "Exclusive (Add GST)" : "Inclusive (Remove GST)"}
GST Rate: ${validRate}%
Base / Net Amount: ${formatRupee(baseAmount)}
Total GST: ${formatRupee(gstAmount)}
- CGST (Central): ${formatRupee(cgstAmount)}
- SGST (State): ${formatRupee(sgstAmount)}
Total Invoice Value: ${formatRupee(totalAmount)}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  return (
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          GST Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Calculate tax-inclusive or tax-exclusive amounts at a rate you enter.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            {/* Type Switcher */}
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500  mb-2">
              Calculation Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100  p-1.5 rounded-md mb-6">
              <button
                type="button"
                onClick={() => setCalcType("exclusive")}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                  calcType === "exclusive"
                    ? "bg-white  text-violet-600  shadow-none"
                    : "text-slate-600  hover:text-slate-900 "
                }`}
              >
                GST Exclusive (+ Add GST)
              </button>
              <button
                type="button"
                onClick={() => setCalcType("inclusive")}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                  calcType === "inclusive"
                    ? "bg-white  text-violet-600  shadow-none"
                    : "text-slate-600  hover:text-slate-900 "
                }`}
              >
                GST Inclusive (- Remove GST)
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label htmlFor={amountInputId} className="block text-sm font-semibold text-slate-800  mb-1.5">
                {calcType === "exclusive" ? "Initial Net Amount (₹)" : "Total Gross / MRP Amount (₹)"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
<FormattedNumberInput
                  id={amountInputId}
                  type="number"
                  min="0"
                  step="100"
                  aria-label="Amount"
                  value={Number.isFinite(amount) ? amount : ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 rounded-md border border-slate-200  bg-slate-50  text-slate-900  text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. 10000"
                />
              </div>
            </div>

            {/* GST Slab Rates */}
            <div>
              <label className="block text-sm font-semibold text-slate-800  mb-2">
                Select GST Rate Slab
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[0, 5, 12, 18, 28].map((slab) => (
                  <button
                    key={slab}
                    type="button"
                    onClick={() => {
                      setRate(slab);
                      setIsCustomRate(false);
                    }}
                    className={`py-3 px-2 rounded-md text-center border font-bold transition-all ${
                      !isCustomRate && rate === slab
                        ? "border-violet-600 bg-violet-50  text-violet-700  ring-2 ring-violet-500/20"
                        : "border-slate-200  bg-white  text-slate-700  hover:bg-slate-50 "
                    }`}
                  >
                    <div className="text-base">{slab}%</div>
                    <div className="text-[10px] font-normal text-slate-500 ">
                      {slab === 0 ? "Zero rate" : "Preset"}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Rate Toggle */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsCustomRate(!isCustomRate)}
                  className="text-xs text-violet-600  font-semibold hover:underline"
                >
                  {isCustomRate ? "Use Standard Slabs" : "+ Enter Custom GST %"}
                </button>

                {isCustomRate && (
                  <div className="mt-2 flex items-center gap-2 max-w-xs">
<FormattedNumberInput
                      id={customRateInputId}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      aria-label="Custom GST rate"
                  value={Number.isFinite(customRate) ? customRate : ""}
                      onChange={(e) => setCustomRate(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-200  bg-slate-50  text-sm font-bold text-slate-900 "
                      placeholder="e.g. 3"
                    />
                    <span className="text-sm font-bold text-slate-600 ">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slabs info box */}
          <div className="bg-slate-50  rounded-lg border border-slate-200  p-5">
            <h3 className="text-sm font-bold text-slate-900  mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>How GST is Split in India</span>
            </h3>
            <p className="text-xs text-slate-600  leading-relaxed">
              When selling within the same state (Intra-state), GST is divided equally between <strong>CGST (Central GST)</strong> and <strong>SGST (State GST)</strong>. When selling to another state (Inter-state), full tax is collected as <strong>IGST (Integrated GST)</strong>.
            </p>
          </div>
        </div>

        {/* Right Output: Invoice Breakdown Card (5 Cols) */}
        <div style={{display:validationError?"none":undefined}} className="lg:col-span-5 min-w-0 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 ">
              <h2 className="text-base font-bold text-slate-900 ">
                Tax Invoice Breakdown
              </h2>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600  bg-slate-100  hover:bg-slate-200  transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            {/* Total invoice big display */}
            <div className="py-5 text-center bg-slate-50  rounded-md my-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 ">
                Total Invoice Value
              </span>
              <div className="text-3xl font-black text-violet-600  mt-1">
                {formatRupee(totalAmount)}
              </div>
              <span className="text-xs text-slate-500  mt-0.5 inline-block">
                Includes Base Price + {validRate}% GST
              </span>
            </div>

            {/* Itemized list */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100  text-slate-600 ">
                <span>Net / Base Amount:</span>
                <span className="font-bold text-slate-900 ">{formatRupee(baseAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100  text-slate-600 ">
                <span>Total GST Amount ({validRate}%):</span>
                <span className="font-bold text-rose-600 ">+{formatRupee(gstAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100  text-xs text-slate-500  pl-3">
                <span>↳ CGST ({(validRate / 2).toFixed(1)}%):</span>
                <span>{formatRupee(cgstAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100  text-xs text-slate-500  pl-3">
                <span>↳ SGST ({(validRate / 2).toFixed(1)}%):</span>
                <span>{formatRupee(sgstAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100  text-xs text-slate-500  pl-3">
                <span>↳ Or IGST ({validRate}%):</span>
                <span>{formatRupee(igstAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-extrabold text-slate-900 ">
                <span>Gross Payable:</span>
                <span className="text-violet-600 ">{formatRupee(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Quick links to other calculators */}
          <div className="bg-slate-50  rounded-lg border border-slate-200  p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500  mb-3">
              Other Popular Calculators
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/income-tax-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-violet-500" />
                <span>Income Tax Calc</span>
              </Link>
              <Link
                href="/sip-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-violet-500" />
                <span>SIP Calculator</span>
              </Link>
              <Link
                href="/percentage-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <Percent className="w-3.5 h-3.5 text-violet-500" />
                <span>Percentage Calc</span>
              </Link>
              <Link
                href="/emi-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-violet-500" />
                <span>EMI Calculator</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

