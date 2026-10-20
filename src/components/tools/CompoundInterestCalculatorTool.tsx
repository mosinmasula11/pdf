"use client";

import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

import { useState, useId } from "react";
import Link from "next/link";
import { compoundProjection } from "@/lib/extended-calculators";
import { TrendingUp, Coins, Receipt, Building2, Calendar, ChevronDown, ChevronUp } from "lucide-react";

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

  let validationError="";
  let projection:ReturnType<typeof compoundProjection>={yearlyData:[],finalBalance:0,totalPrincipalInvested:0,totalInterestEarned:0};
  try{projection=compoundProjection(principal,monthlyDeposit,rate,years,frequency);}catch(error){validationError=error instanceof Error?error.message:"Check the investment details.";}
  const {yearlyData,finalBalance,totalPrincipalInvested,totalInterestEarned}=projection;

  const investedPercent = finalBalance > 0 ? (totalPrincipalInvested / finalBalance) * 100 : 0;
  const interestPercent = Math.max(0, 100 - investedPercent);

  const { money, symbol } = useCurrencyFormat(false);
  const formatRupee = (value: number) => money(value, 0);

  return (
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          Compound Interest Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Estimate growth from an initial balance and regular monthly contributions.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            {/* Initial Principal */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={principalId} className="text-sm font-semibold text-slate-800 ">
                  Initial Principal Amount
                </label>
                <div className="relative">
<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
<FormattedNumberInput
                    id={principalId}
                    type="number"
                    aria-label="Initial balance"
                  placeholder="Enter a value"
                  min={0}
                  max={100000000}
                  step="any"
                  value={Number.isFinite(principal) ? principal : ""}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-36 pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                  />
                </div>
              </div>
              <input
                type="range"
                  aria-label="Initial balance slider"
                min={0}
                  max={100000000}
                  step="any"
                  value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
              />
            </div>

            {/* Monthly Contribution */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={monthlyDepositId} className="text-sm font-semibold text-slate-800 ">
                  Monthly Contribution
                </label>
                <div className="relative">
<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
<FormattedNumberInput
                    id={monthlyDepositId}
                    type="number"
                    aria-label="Monthly deposit"
                  placeholder="Enter a value"
                  min={0}
                  max={10000000}
                  step="any"
                  value={Number.isFinite(monthlyDeposit) ? monthlyDeposit : ""}
                    onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                    className="w-36 pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                  />
                </div>
              </div>
              <input
                type="range"
                  aria-label="Monthly deposit slider"
                min={0}
                  max={10000000}
                  step="any"
                  value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
              />
            </div>

            {/* Rate of return */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={rateId} className="text-sm font-semibold text-slate-800 ">
                  Annual Interest Rate (p.a)
                </label>
                <div className="relative">
<FormattedNumberInput
                    id={rateId}
                    type="number"
                    aria-label="Annual rate"
                  placeholder="Enter a value"
                  min={0}
                  max={100}
                  step="any"
                  value={Number.isFinite(rate) ? rate : ""}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-24 pr-6 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
              <input
                type="range"
                  aria-label="Annual rate slider"
                min={0}
                  max={100}
                  step="any"
                  value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
              />
            </div>

            {/* Time Period */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={yearsId} className="text-sm font-semibold text-slate-800 ">
                  Investment Period (Years)
                </label>
                <div className="relative">
<FormattedNumberInput
                    id={yearsId}
                    type="number"
                    aria-label="Years"
                  placeholder="Enter a value"
                  min={1}
                  max={50}
                  step={1}
                  value={Number.isFinite(years) ? years : ""}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-24 pr-8 pl-2 py-1.5 text-right font-bold text-sm bg-slate-50  border border-slate-200  rounded-lg text-slate-900 "
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Yr</span>
                </div>
              </div>
              <input
                type="range"
                  aria-label="Years slider"
                min={1}
                  max={50}
                  step={1}
                  value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100  rounded-lg"
              />
            </div>

            {/* Compounding Frequency */}
            <div>
              <label className="block text-sm font-semibold text-slate-800  mb-2">
                Compounding Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold">
                {[
                  { label: "Annually", val: 1 },
                  { label: "Semi-Annually", val: 2 },
                  { label: "Quarterly", val: 4 },
                  { label: "Monthly", val: 12 },
                  { label: "Daily", val: 365 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFrequency(item.val)}
                    className={`py-2 rounded-lg border transition-all ${
                      frequency === item.val
                        ? "border-violet-600 bg-violet-50  text-violet-700  ring-2 ring-violet-500/20"
                        : "border-slate-200  bg-white  text-slate-700 "
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
        <div style={{display:validationError?"none":undefined}} className="lg:col-span-5 min-w-0 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            {/* SVG Donut Chart */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-100 "
                    strokeWidth="14"
                    fill="none"
                  />
                  {/* Principal slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-violet-300  transition-all duration-500"
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
                  <span className="text-sm font-black text-slate-900  leading-tight">
                    {formatRupee(finalBalance)}
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-300 " />
                  <span className="text-slate-600 ">
                    Invested ({investedPercent.toFixed(0)}%)
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

            {/* Results Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100  space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 ">Total Invested Amount:</span>
                <span className="font-extrabold text-slate-900 ">{formatRupee(totalPrincipalInvested)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 ">Total Interest Earned:</span>
                <span className="font-extrabold text-emerald-600 ">+{formatRupee(totalInterestEarned)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100  text-base font-black">
                <span className="text-slate-900 ">Future Portfolio Value:</span>
                <span className="text-violet-600 ">{formatRupee(finalBalance)}</span>
              </div>
            </div>
          </div>

          {/* Quick links to other calculators */}
          <div className="bg-slate-50  rounded-lg border border-slate-200  p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500  mb-3">
              Other Financial Tools
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
                href="/income-tax-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                <span>Tax Calculator</span>
              </Link>
              <Link
                href="/gst-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-violet-500" />
                <span>GST Calculator</span>
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

      {/* Yearly Growth Schedule */}
      <div className="mt-8 bg-white  rounded-lg border border-slate-200  p-6">
        <button
          type="button"
          onClick={() => setShowSchedule(!showSchedule)}
          className="w-full flex justify-between items-center text-left font-bold text-slate-900 "
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
                <tr className="border-b border-slate-200  text-slate-400">
                  <th className="py-2.5 font-semibold">Year</th>
                  <th className="py-2.5 font-semibold">Total Invested</th>
                  <th className="py-2.5 font-semibold">Interest Earned</th>
                  <th className="py-2.5 font-semibold">End Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  text-slate-700 ">
                {yearlyData.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50 ">
                    <td className="py-2.5 font-medium">Year {row.year}</td>
                    <td className="py-2.5">{formatRupee(row.invested)}</td>
                    <td className="py-2.5 font-semibold text-emerald-600 ">+{formatRupee(row.interest)}</td>
                    <td className="py-2.5 font-extrabold text-slate-900 ">{formatRupee(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-6 text-xs leading-5 text-slate-500">Illustrative projection, not a guaranteed return. Contributions are added at the start of each month. Growth uses the equivalent monthly rate of the chosen compounding frequency. Taxes, fees and inflation are excluded.</p>
    </div>
  );
}

