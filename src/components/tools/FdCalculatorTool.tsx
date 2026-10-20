"use client";

import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

import { useState, useId } from "react";
import Link from "next/link";
import { depositProjection } from "@/lib/extended-calculators";
import { Building2, Coins, TrendingUp, Receipt } from "lucide-react";

export function FdCalculatorTool() {
  const depositId = useId();
  const rateId = useId();
  const tenureId = useId();

  const [activeTab, setActiveTab] = useState<"fd" | "rd" | "ppf">("fd");

  // FD State
  const [fdPrincipal, setFdPrincipal] = useState<number>(100000);
  const [fdRate, setFdRate] = useState<number>(7.1);
  const [fdYears, setFdYears] = useState<number>(5);
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);

  // RD State
  const [rdMonthly, setRdMonthly] = useState<number>(5000);
  const [rdRate, setRdRate] = useState<number>(7.0);
  const [rdYears, setRdYears] = useState<number>(3);

  // PPF State
  const [ppfAnnual, setPpfAnnual] = useState<number>(150000);
  const [ppfYears, setPpfYears] = useState<number>(15);
  const ppfFixedRate = 7.1; // Illustrative rate.

  let validationError="";
  let projection={investedAmount:0,maturityValue:0,interestEarned:0};
  try{projection=depositProjection(activeTab,activeTab==="fd"?fdPrincipal:activeTab==="rd"?rdMonthly:ppfAnnual,activeTab==="fd"?fdRate+(isSeniorCitizen ? 0.5 : 0):activeTab==="rd"?rdRate:ppfFixedRate,activeTab==="fd"?fdYears:activeTab==="rd"?rdYears:ppfYears);}
  catch(error){validationError=error instanceof Error?error.message:"Check the deposit details.";}
  const {investedAmount,maturityValue,interestEarned}=projection;

  const investedPercent = maturityValue > 0 ? (investedAmount / maturityValue) * 100 : 0;
  const interestPercent = Math.max(0, 100 - investedPercent);

  const { money, symbol } = useCurrencyFormat(activeTab === "ppf");
  const formatRupee = (value: number) => money(value, 0);

  return (
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          FD, RD & PPF Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Estimate deposit maturity with the rate and compounding assumptions you choose.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            {/* Tab switch */}
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500  mb-2">
              Select Investment Scheme
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100  p-1.5 rounded-md mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("fd")}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "fd"
                    ? "bg-white  text-violet-600  shadow-none"
                    : "text-slate-600 "
                }`}
              >
                Fixed Deposit (FD)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rd")}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "rd"
                    ? "bg-white  text-violet-600  shadow-none"
                    : "text-slate-600 "
                }`}
              >
                Recurring Deposit (RD)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ppf")}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "ppf"
                    ? "bg-white  text-violet-600  shadow-none"
                    : "text-slate-600 "
                }`}
              >
                PPF Scheme
              </button>
            </div>

            {/* FD Controls */}
            {activeTab === "fd" && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor={depositId} className="text-sm font-semibold text-slate-800 ">
                      Total FD Investment Amount
                    </label>
                    <div className="relative">
<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
<FormattedNumberInput
                        id={depositId}
                        type="number"
                        aria-label="FD deposit"
                  placeholder="Enter a value"
                  min={1}
                  max={100000000}
                  step="any"
                  value={Number.isFinite(fdPrincipal) ? fdPrincipal : ""}
                        onChange={(e) => setFdPrincipal(Number(e.target.value))}
                        className="w-36 pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                  aria-label="FD deposit slider"
                    min={1}
                  max={100000000}
                  step="any"
                  value={fdPrincipal}
                    onChange={(e) => setFdPrincipal(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor={rateId} className="text-sm font-semibold text-slate-800 ">
                      Rate of Interest (p.a)
                    </label>
                    <div className="relative">
<FormattedNumberInput
                        id={rateId}
                        type="number"
                        aria-label="FD annual rate"
                  placeholder="Enter a value"
                  min={0}
                  max={50}
                  step="any"
                  value={Number.isFinite(fdRate) ? fdRate : ""}
                        onChange={(e) => setFdRate(Number(e.target.value))}
                        className="w-24 pr-6 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                  aria-label="FD annual rate slider"
                    min={0}
                  max={50}
                  step="any"
                  value={fdRate}
                    onChange={(e) => setFdRate(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor={tenureId} className="text-sm font-semibold text-slate-800 ">
                      Time Period (Years)
                    </label>
                    <div className="relative">
<FormattedNumberInput
                        id={tenureId}
                        type="number"
                        aria-label="FD tenure"
                  placeholder="Enter a value"
                  min={0.08333333333333333}
                  max={50}
                  step="any"
                  value={Number.isFinite(fdYears) ? fdYears : ""}
                        onChange={(e) => setFdYears(Number(e.target.value))}
                        className="w-24 pr-8 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                  aria-label="FD tenure slider"
                    min={0.08333333333333333}
                  max={50}
                  step="any"
                  value={fdYears}
                    onChange={(e) => setFdYears(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>

                {/* Senior Citizen Checkbox */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 ">
                  <input
                    type="checkbox"
                    id="seniorCitizen"
                    checked={isSeniorCitizen}
                    onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600"
                  />
                  <label htmlFor="seniorCitizen" className="text-sm font-medium text-slate-700 ">
                    Senior Citizen (+0.50% extra interest bonus)
                  </label>
                </div>
              </>
            )}

            {/* RD Controls */}
            {activeTab === "rd" && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 ">
                      Monthly Deposit ({symbol})
                    </label>
<FormattedNumberInput
                      type="number"
                      aria-label="RD monthly deposit"
                  placeholder="Enter a value"
                  min={1}
                  max={100000000}
                  step="any"
                  value={Number.isFinite(rdMonthly) ? rdMonthly : ""}
                      onChange={(e) => setRdMonthly(Number(e.target.value))}
                      className="w-36 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                    />
                  </div>
                  <input
                    type="range"
                  aria-label="RD monthly deposit slider"
                    min={1}
                  max={100000000}
                  step="any"
                  value={rdMonthly}
                    onChange={(e) => setRdMonthly(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 ">
                      Rate of Interest (p.a)
                    </label>
<FormattedNumberInput
                      type="number"
                      aria-label="RD annual rate"
                  placeholder="Enter a value"
                  min={0}
                  max={50}
                  step="any"
                  value={Number.isFinite(rdRate) ? rdRate : ""}
                      onChange={(e) => setRdRate(Number(e.target.value))}
                      className="w-24 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                    />
                  </div>
                  <input
                    type="range"
                  aria-label="RD annual rate slider"
                    min={0}
                  max={50}
                  step="any"
                  value={rdRate}
                    onChange={(e) => setRdRate(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 ">
                      Time Period (Years)
                    </label>
<FormattedNumberInput
                      type="number"
                      aria-label="RD tenure"
                  placeholder="Enter a value"
                  min={0.08333333333333333}
                  max={50}
                  step="any"
                  value={Number.isFinite(rdYears) ? rdYears : ""}
                      onChange={(e) => setRdYears(Number(e.target.value))}
                      className="w-24 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                    />
                  </div>
                  <input
                    type="range"
                  aria-label="RD tenure slider"
                    min={0.08333333333333333}
                  max={50}
                  step="any"
                  value={rdYears}
                    onChange={(e) => setRdYears(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>
              </>
            )}

            {/* PPF Controls */}
            {activeTab === "ppf" && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 ">
                      Yearly Contribution ({symbol})
                    </label>
<FormattedNumberInput
                      type="number"
                      aria-label="PPF yearly deposit"
                  placeholder="Enter a value"
                  min={500}
                  max={150000}
                  step="any"
                  value={Number.isFinite(ppfAnnual) ? ppfAnnual : ""}
                      onChange={(e) => setPpfAnnual(Number(e.target.value))}
                      className="w-36 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                    />
                  </div>
                  <input
                    type="range"
                  aria-label="PPF yearly deposit slider"
                    min={500}
                  max={150000}
                  step="any"
                  value={ppfAnnual}
                    onChange={(e) => setPpfAnnual(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * PPF allows a maximum deposit of ₹1,50,000 per financial year under 80C.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 ">
                      PPF Scheme Tenure (Min 15 Years)
                    </label>
<FormattedNumberInput
                      type="number"
                      aria-label="PPF tenure"
                  placeholder="Enter a value"
                  min={15}
                  max={50}
                  step={1}
                  value={Number.isFinite(ppfYears) ? ppfYears : ""}
                      onChange={(e) => setPpfYears(Number(e.target.value))}
                      className="w-24 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                    />
                  </div>
                  <input
                    type="range"
                  aria-label="PPF tenure slider"
                    min={15}
                  max={50}
                  step={1}
                  value={ppfYears}
                    onChange={(e) => setPpfYears(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
                  />
                </div>

                <div className="p-3 bg-emerald-50  rounded-md border border-emerald-200  text-xs text-emerald-800 ">
                  Assumed Interest Rate: <strong>{ppfFixedRate}% p.a.</strong> (Illustration only; confirm applicable rates and tax treatment)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Output: SVG Donut Chart & Results (5 Cols) */}
        <div style={{display:validationError?"none":undefined}} className="lg:col-span-5 min-w-0 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            {/* SVG Donut */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-100 "
                    strokeWidth="14"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-300  transition-all duration-500"
                    strokeWidth="14"
                    strokeDasharray={`${(investedPercent * 238.76) / 100} 238.76`}
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-600 transition-all duration-500"
                    strokeWidth="14"
                    strokeDasharray={`${(interestPercent * 238.76) / 100} 238.76`}
                    strokeDashoffset={`-${(investedPercent * 238.76) / 100}`}
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Maturity Value
                  </span>
                  <span className="text-sm font-black text-slate-900  leading-tight">
                    {formatRupee(maturityValue)}
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-300 " />
                  <span className="text-slate-600 ">
                    Principal ({investedPercent.toFixed(0)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="text-slate-600 ">
                    Interest ({interestPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-4 pt-4 border-t border-slate-100  space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 ">Invested Amount:</span>
                <span className="font-extrabold text-slate-900 ">{formatRupee(investedAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 ">Total Interest Earned:</span>
                <span className="font-extrabold text-emerald-600 ">+{formatRupee(interestEarned)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100  text-base font-black">
                <span className="text-slate-900 ">Total Maturity Amount:</span>
                <span className="text-violet-600 ">{formatRupee(maturityValue)}</span>
              </div>
            </div>
          </div>

          {/* Quick links to other calculators */}
          <div className="bg-slate-50  rounded-lg border border-slate-200  p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500  mb-3">
              Related Calculators
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/sip-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-violet-500" />
                <span>SIP Calculator</span>
              </Link>
              <Link
                href="/compound-interest-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                <span>Compound Interest</span>
              </Link>
              <Link
                href="/income-tax-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-violet-500" />
                <span>Tax Calculator</span>
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
      <p className="mt-6 text-xs leading-5 text-slate-500">Estimates exclude taxes, fees and early withdrawal penalties. FD/RD assume quarterly compounding. PPF assumes 7.1% annually and beginning-of-year deposits. Senior-citizen bonus is an illustrative 0.5 percentage points; confirm actual rates with the provider.</p>
    </div>
  );
}

