"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  Building2,
  Coins,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Sparkles,
  PieChart,
  Calendar,
  CheckCircle2,
} from "lucide-react";

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
  const ppfFixedRate = 7.1; // Official Indian Gov PPF rate

  // Calculations
  let investedAmount = 0;
  let maturityValue = 0;
  let interestEarned = 0;

  if (activeTab === "fd") {
    const p = Math.max(0, Number(fdPrincipal) || 0);
    const effectiveRate = Number(fdRate) + (isSeniorCitizen ? 0.5 : 0);
    const r = effectiveRate / 100;
    const t = Math.max(1, Number(fdYears) || 1);
    // Bank FD compounds quarterly: A = P * (1 + r/4)^(4*t)
    maturityValue = Math.round(p * (1 + r / 4) ** (4 * t));
    investedAmount = p;
    interestEarned = Math.max(0, maturityValue - investedAmount);
  } else if (activeTab === "rd") {
    const monthly = Math.max(0, Number(rdMonthly) || 0);
    const r = Number(rdRate) / 100;
    const t = Math.max(1, Number(rdYears) || 1);
    const totalMonths = t * 12;
    investedAmount = monthly * totalMonths;

    // RD standard quarterly compounding formula:
    // Maturity = sum for i=1..n of monthly * (1 + r/4)^(4 * (n - i + 1)/12)
    let total = 0;
    for (let m = 1; m <= totalMonths; m++) {
      const quartersRemaining = (totalMonths - m + 1) / 3;
      total += monthly * (1 + r / 4) ** quartersRemaining;
    }
    maturityValue = Math.round(total);
    interestEarned = Math.max(0, maturityValue - investedAmount);
  } else {
    // PPF
    const annual = Math.max(500, Math.min(150000, Number(ppfAnnual) || 0));
    const t = Math.max(15, Math.min(30, Number(ppfYears) || 15));
    investedAmount = annual * t;

    let balance = 0;
    const r = ppfFixedRate / 100;
    for (let y = 1; y <= t; y++) {
      balance = (balance + annual) * (1 + r);
    }
    maturityValue = Math.round(balance);
    interestEarned = Math.max(0, maturityValue - investedAmount);
  }

  const investedPercent = maturityValue > 0 ? (investedAmount / maturityValue) * 100 : 50;
  const interestPercent = Math.max(0, 100 - investedPercent);

  const formatRupee = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>Guaranteed Returns & Fixed Savings Schemes</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          FD, RD & PPF Calculator
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Calculate maturity returns for Bank Fixed Deposits (FD), Recurring Deposits (RD), and Public Provident Fund (PPF) with quarterly & annual compounding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Tab switch */}
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Investment Scheme
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("fd")}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "fd"
                    ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Fixed Deposit (FD)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rd")}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "rd"
                    ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Recurring Deposit (RD)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ppf")}
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "ppf"
                    ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
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
                    <label htmlFor={depositId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Total FD Investment Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id={depositId}
                        type="number"
                        min="1000"
                        step="5000"
                        value={fdPrincipal || ""}
                        onChange={(e) => setFdPrincipal(Number(e.target.value))}
                        className="w-36 pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="5000000"
                    step="10000"
                    value={fdPrincipal}
                    onChange={(e) => setFdPrincipal(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor={rateId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Rate of Interest (p.a)
                    </label>
                    <div className="relative">
                      <input
                        id={rateId}
                        type="number"
                        min="3"
                        max="15"
                        step="0.1"
                        value={fdRate || ""}
                        onChange={(e) => setFdRate(Number(e.target.value))}
                        className="w-24 pr-6 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="0.1"
                    value={fdRate}
                    onChange={(e) => setFdRate(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor={tenureId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Time Period (Years)
                    </label>
                    <div className="relative">
                      <input
                        id={tenureId}
                        type="number"
                        min="1"
                        max="25"
                        value={fdYears || ""}
                        onChange={(e) => setFdYears(Number(e.target.value))}
                        className="w-24 pr-8 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={fdYears}
                    onChange={(e) => setFdYears(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Senior Citizen Checkbox */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="checkbox"
                    id="seniorCitizen"
                    checked={isSeniorCitizen}
                    onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600"
                  />
                  <label htmlFor="seniorCitizen" className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Monthly Deposit (₹)
                    </label>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={rdMonthly || ""}
                      onChange={(e) => setRdMonthly(Number(e.target.value))}
                      className="w-36 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={rdMonthly}
                    onChange={(e) => setRdMonthly(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Rate of Interest (p.a)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="15"
                      step="0.1"
                      value={rdRate || ""}
                      onChange={(e) => setRdRate(Number(e.target.value))}
                      className="w-24 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="0.1"
                    value={rdRate}
                    onChange={(e) => setRdRate(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Time Period (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rdYears || ""}
                      onChange={(e) => setRdYears(Number(e.target.value))}
                      className="w-24 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={rdYears}
                    onChange={(e) => setRdYears(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </>
            )}

            {/* PPF Controls */}
            {activeTab === "ppf" && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Yearly Contribution (₹)
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="150000"
                      step="5000"
                      value={ppfAnnual || ""}
                      onChange={(e) => setPpfAnnual(Number(e.target.value))}
                      className="w-36 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="150000"
                    step="5000"
                    value={ppfAnnual}
                    onChange={(e) => setPpfAnnual(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * PPF allows a maximum deposit of ₹1,50,000 per financial year under 80C.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      PPF Scheme Tenure (Min 15 Years)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="30"
                      step="5"
                      value={ppfYears || ""}
                      onChange={(e) => setPpfYears(Number(e.target.value))}
                      className="w-24 pl-3 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="30"
                    step="5"
                    value={ppfYears}
                    onChange={(e) => setPpfYears(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  Govt Interest Rate: <strong>{ppfFixedRate}% p.a.</strong> (Guaranteed Sovereign Backing & 100% Tax-Free under EEE status)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Output: SVG Donut Chart & Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* SVG Donut */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-100 dark:stroke-slate-800"
                    strokeWidth="14"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-300 dark:stroke-violet-400 transition-all duration-500"
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
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {formatRupee(maturityValue)}
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-300 dark:bg-violet-400" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Principal ({investedPercent.toFixed(0)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Interest ({interestPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Invested Amount:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatRupee(investedAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Interest Earned:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">+{formatRupee(interestEarned)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-base font-black">
                <span className="text-slate-900 dark:text-white">Total Maturity Amount:</span>
                <span className="text-violet-600 dark:text-violet-400">{formatRupee(maturityValue)}</span>
              </div>
            </div>
          </div>

          {/* Quick links to other calculators */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Related Calculators
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/sip-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-violet-500" />
                <span>SIP Calculator</span>
              </Link>
              <Link
                href="/compound-interest-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                <span>Compound Interest</span>
              </Link>
              <Link
                href="/income-tax-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-violet-500" />
                <span>Tax Calculator</span>
              </Link>
              <Link
                href="/emi-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
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

