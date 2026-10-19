"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Coins,
  Receipt,
  Building2,
  Calendar,
  Sparkles,
  PieChart,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function CompoundInterestCalculatorTool() {
  const principalId = useId();
  const monthlyDepositId = useId();
  const rateId = useId();
  const yearsId = useId();

  const [principal, setPrincipal] = useState<number>(100000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(5000);
  const [rate, setRate] = useState<number>(10);
  const [years, setYears] = useState<number>(10);
  const [frequency, setFrequency] = useState<number>(12); // 12 = monthly, 4 = quarterly, 1 = annually, 365 = daily
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // Exact compound interest with periodic additions
  // For each year, calculate compounded growth
  const validP = Math.max(0, Number(principal) || 0);
  const validPMT = Math.max(0, Number(monthlyDeposit) || 0);
  const validR = Math.max(0, Number(rate) || 0) / 100;
  const validY = Math.max(1, Math.min(50, Number(years) || 1));
  const n = frequency;

  // Year-by-year schedule calculation
  const yearlyData: Array<{
    year: number;
    invested: number;
    interest: number;
    balance: number;
  }> = [];

  let currentBalance = validP;
  let totalInvested = validP;

  for (let y = 1; y <= validY; y++) {
    const startBalance = currentBalance;
    const yearDeposits = validPMT * 12;
    totalInvested += yearDeposits;

    // Monthly compounding with monthly deposit simulation for accuracy
    for (let m = 0; m < 12; m++) {
      currentBalance = (currentBalance + validPMT) * (1 + validR / n) ** (n / 12);
    }

    const yearInterest = currentBalance - (startBalance + yearDeposits);
    yearlyData.push({
      year: y,
      invested: Math.round(totalInvested),
      interest: Math.round(currentBalance - totalInvested),
      balance: Math.round(currentBalance),
    });
  }

  const finalBalance = Math.round(currentBalance);
  const totalPrincipalInvested = Math.round(totalInvested);
  const totalInterestEarned = Math.max(0, finalBalance - totalPrincipalInvested);

  const investedPercent = finalBalance > 0 ? (totalPrincipalInvested / finalBalance) * 100 : 50;
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
          <TrendingUp className="w-3.5 h-3.5" />
          <span>The 8th Wonder of the World</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Compound Interest Calculator
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Visualize the power of compounding with regular monthly additions and see your wealth snowball over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Initial Principal */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={principalId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Initial Principal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    id={principalId}
                    type="number"
                    min="0"
                    step="5000"
                    value={principal || ""}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-36 pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="5000000"
                step="10000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* Monthly Contribution */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={monthlyDepositId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Monthly Contribution
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    id={monthlyDepositId}
                    type="number"
                    min="0"
                    step="500"
                    value={monthlyDeposit || ""}
                    onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                    className="w-36 pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="500"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* Rate of return */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={rateId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Annual Interest Rate (p.a)
                </label>
                <div className="relative">
                  <input
                    id={rateId}
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    value={rate || ""}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-24 pr-6 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* Time Period */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={yearsId} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Investment Period (Years)
                </label>
                <div className="relative">
                  <input
                    id={yearsId}
                    type="number"
                    min="1"
                    max="40"
                    value={years || ""}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-24 pr-8 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Yr</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* Compounding Frequency */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Compounding Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                {[
                  { label: "Annually", val: 1 },
                  { label: "Semi-Annually", val: 2 },
                  { label: "Quarterly", val: 4 },
                  { label: "Monthly", val: 12 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFrequency(item.val)}
                    className={`py-2 rounded-lg border transition-all ${
                      frequency === item.val
                        ? "border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: SVG Donut Chart & Metrics (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* SVG Donut Chart */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-100 dark:stroke-slate-800"
                    strokeWidth="14"
                    fill="none"
                  />
                  {/* Principal slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-300 dark:stroke-violet-400 transition-all duration-500"
                    strokeWidth="14"
                    strokeDasharray={`${(investedPercent * 238.76) / 100} 238.76`}
                    fill="none"
                  />
                  {/* Interest slice */}
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
                    Total Value
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {formatRupee(finalBalance)}
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-300 dark:bg-violet-400" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Invested ({investedPercent.toFixed(0)}%)
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

            {/* Results Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Invested Amount:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatRupee(totalPrincipalInvested)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Interest Earned:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">+{formatRupee(totalInterestEarned)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-base font-black">
                <span className="text-slate-900 dark:text-white">Future Portfolio Value:</span>
                <span className="text-violet-600 dark:text-violet-400">{formatRupee(finalBalance)}</span>
              </div>
            </div>
          </div>

          {/* Quick links to other calculators */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Other Financial Tools
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
                href="/income-tax-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                <span>Tax Calculator</span>
              </Link>
              <Link
                href="/gst-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-violet-500" />
                <span>GST Calculator</span>
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

      {/* Yearly Growth Schedule */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <button
          type="button"
          onClick={() => setShowSchedule(!showSchedule)}
          className="w-full flex justify-between items-center text-left font-bold text-slate-900 dark:text-white"
        >
          <span className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            <span>Yearly Compound Growth Schedule</span>
          </span>
          {showSchedule ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showSchedule && (
          <div className="mt-4 overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                  <th className="py-2.5 font-semibold">Year</th>
                  <th className="py-2.5 font-semibold">Total Invested</th>
                  <th className="py-2.5 font-semibold">Interest Earned</th>
                  <th className="py-2.5 font-semibold">End Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {yearlyData.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 font-medium">Year {row.year}</td>
                    <td className="py-2.5">{formatRupee(row.invested)}</td>
                    <td className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400">+{formatRupee(row.interest)}</td>
                    <td className="py-2.5 font-extrabold text-slate-900 dark:text-white">{formatRupee(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

