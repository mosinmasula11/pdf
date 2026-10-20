"use client";

import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

import { useState, useId } from "react";
import Link from "next/link";
import { IndianAmountInput } from "./IndianAmountInput";
import { newTaxSlabs, residentTax } from "@/lib/income-tax";
import { Coins, TrendingDown, CheckCircle2, FileSpreadsheet, Building2, Receipt } from "lucide-react";

interface DeductionState {
  sec80C: number;
  sec80D: number;
  hra: number;
  homeLoanInterest: number;
  nps80CCD: number;
  otherDeductions: number;
}

export function IncomeTaxCalculatorTool() {
  const grossSalaryId = useId();
  const otherIncomeId = useId();
  const sec80CId = useId();
  const sec80DId = useId();
  const hraId = useId();
  const homeLoanId = useId();
  const npsId = useId();
  const otherDedId = useId();

  // Basic inputs
  const [financialYear, setFinancialYear] = useState<"FY2024-25" | "FY2025-26">("FY2024-25");
  const [taxpayerType, setTaxpayerType] = useState<"salaried" | "individual">("salaried");
  const [ageCategory, setAgeCategory] = useState<"below60" | "60to80" | "above80">("below60");
  const [grossIncome, setGrossIncome] = useState<number>(1200000);
  const [otherIncome, setOtherIncome] = useState<number>(50000);

  // Deductions (Old Regime)
  const [deductions, setDeductions] = useState<DeductionState>({
    sec80C: 150000,
    sec80D: 25000,
    hra: 120000,
    homeLoanInterest: 0,
    nps80CCD: 50000,
    otherDeductions: 0,
  });


  // Calculations
  const isSalaried = taxpayerType === "salaried";
  const standardDeductionNew = isSalaried ? Math.min(grossIncome, 75000) : 0;
  const standardDeductionOld = isSalaried ? Math.min(grossIncome, 50000) : 0;

  const totalGross = (Number(grossIncome) || 0) + (Number(otherIncome) || 0);

  // Old Regime Deductions
  const capped80C = Math.min(Math.max(0, deductions.sec80C), 150000);
  const capped80D = Math.min(Math.max(0, deductions.sec80D), 100000);
  const cappedHomeLoan = Math.min(Math.max(0, deductions.homeLoanInterest), 200000);
  const cappedNps = Math.min(Math.max(0, deductions.nps80CCD), 50000);
  const totalOldDeductions =
    standardDeductionOld +
    capped80C +
    capped80D +
    Math.max(0, deductions.hra) +
    cappedHomeLoan +
    cappedNps +
    Math.max(0, deductions.otherDeductions);

  const taxableIncomeOld = Math.max(0, totalGross - totalOldDeductions);
  const taxableIncomeNew = Math.max(0, totalGross - standardDeductionNew);

  const validationError=[grossIncome,otherIncome,...Object.values(deductions)].some(value=>!Number.isFinite(value)||value<0)?"Income and deductions must be finite, non-negative amounts.":totalGross>5000000?"This estimator supports gross income up to ₹50 lakh. Higher incomes require surcharge calculations.":"";
  const oldResult=residentTax(validationError?0:taxableIncomeOld,"old",financialYear,ageCategory);
  const newResult=residentTax(validationError?0:taxableIncomeNew,"new",financialYear,ageCategory);

  const difference = Math.abs(oldResult.totalTax - newResult.totalTax);
  const isNewBetter = newResult.totalTax < oldResult.totalTax;
  const isOldBetter = oldResult.totalTax < newResult.totalTax;
  const isSame = newResult.totalTax === oldResult.totalTax;

  const { money } = useCurrencyFormat(true);
  const formatRupee = (value: number) => money(value, 0);

  return (
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Title & Badges */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          Income Tax Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Compare estimated income tax under the old and new regimes.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            <h2 className="text-lg font-bold text-slate-900  mb-5 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-violet-600 " />
              <span>1. Basic Income Details</span>
            </h2>

            {/* FY & Profile selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500  mb-1.5">
                  Financial Year
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100  p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFinancialYear("FY2024-25")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      financialYear === "FY2024-25"
                        ? "bg-white  text-violet-600  shadow-none"
                        : "text-slate-600 "
                    }`}
                  >
                    2024-25
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialYear("FY2025-26")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      financialYear === "FY2025-26"
                        ? "bg-white  text-violet-600  shadow-none"
                        : "text-slate-600 "
                    }`}
                  >
                    2025-26
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500  mb-1.5">
                  Employment Type
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100  p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTaxpayerType("salaried")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      taxpayerType === "salaried"
                        ? "bg-white  text-violet-600  shadow-none"
                        : "text-slate-600 "
                    }`}
                  >
                    Salaried
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxpayerType("individual")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      taxpayerType === "individual"
                        ? "bg-white  text-violet-600  shadow-none"
                        : "text-slate-600 "
                    }`}
                  >
                    Non-salaried
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500  mb-1.5">
                  Age Category
                </label>
                <select
                  value={ageCategory}
                  onChange={(e) => setAgeCategory(e.target.value as "below60" | "60to80" | "above80")}
                  className="w-full text-xs font-semibold bg-slate-100  border-0 rounded-lg py-2.5 px-3 text-slate-800  focus:ring-2 focus:ring-violet-500"
                >
                  <option value="below60">&lt; 60 Years (General)</option>
                  <option value="60to80">60 - 79 Years (Senior)</option>
                  <option value="above80">80+ Years (Super Senior)</option>
                </select>
              </div>
            </div>

            {/* Income Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={grossSalaryId} className="block text-sm font-semibold text-slate-800  mb-1.5">
                  Gross Annual Income (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold" aria-hidden="true">₹</span>
                  <IndianAmountInput id={grossSalaryId} label="Gross salary or income" initialValue={grossIncome} onChange={setGrossIncome} placeholder="e.g. 12,00,000" />
                </div>
                <p className="text-xs text-slate-500  mt-1">
                  Salary / ordinary income before standard deductions
                </p>
              </div>

              <div>
                <label htmlFor={otherIncomeId} className="block text-sm font-semibold text-slate-800  mb-1.5">
                  Income from Other Sources (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold" aria-hidden="true">₹</span>
                  <IndianAmountInput id={otherIncomeId} label="Other income" initialValue={otherIncome} onChange={setOtherIncome} placeholder="e.g. 50,000" />
                </div>
                <p className="text-xs text-slate-500  mt-1">
                  Ordinary slab-rate income only; exclude capital gains.
                </p>
              </div>
            </div>
          </div>

          {/* Old Regime Deductions Section */}
          <div className="bg-white  rounded-lg border border-slate-200  p-6 shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900  flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600 " />
                  <span>2. Deductions (Applicable to Old Regime)</span>
                </h2>
                <p className="text-xs text-slate-500  mt-0.5">
                  Standard deduction of {formatRupee(standardDeductionOld)} (Old) & {formatRupee(standardDeductionNew)} (New) is automatically applied.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={sec80CId} className="text-xs font-semibold text-slate-700 ">
                    Section 80C (PPF, ELSS, EPF, LIC)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹1.5L</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
<FormattedNumberInput
                    id={sec80CId}
                    type="number"
                    min="0"
                    max="150000"
                    value={deductions.sec80C || ""}
                    onChange={(e) => setDeductions({ ...deductions, sec80C: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200  bg-slate-50  text-slate-900  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={sec80DId} className="text-xs font-semibold text-slate-700 ">
                    Section 80D (Health Insurance)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹25k - ₹1L</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
<FormattedNumberInput
                    id={sec80DId}
                    type="number"
                    min="0"
                    value={deductions.sec80D || ""}
                    onChange={(e) => setDeductions({ ...deductions, sec80D: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200  bg-slate-50  text-slate-900  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={hraId} className="text-xs font-semibold text-slate-700 ">
                    HRA Exemption
                  </label>
                  <span className="text-[10px] text-slate-400">House Rent Allowance</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
<FormattedNumberInput
                    id={hraId}
                    type="number"
                    min="0"
                    value={deductions.hra || ""}
                    onChange={(e) => setDeductions({ ...deductions, hra: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200  bg-slate-50  text-slate-900  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={homeLoanId} className="text-xs font-semibold text-slate-700 ">
                    Sec 24(b) (Home Loan Interest)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹2L</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
<FormattedNumberInput
                    id={homeLoanId}
                    type="number"
                    min="0"
                    max="200000"
                    value={deductions.homeLoanInterest || ""}
                    onChange={(e) => setDeductions({ ...deductions, homeLoanInterest: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200  bg-slate-50  text-slate-900  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={npsId} className="text-xs font-semibold text-slate-700 ">
                    NPS 80CCD(1B)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹50,000</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
<FormattedNumberInput
                    id={npsId}
                    type="number"
                    min="0"
                    max="50000"
                    value={deductions.nps80CCD || ""}
                    onChange={(e) => setDeductions({ ...deductions, nps80CCD: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200  bg-slate-50  text-slate-900  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={otherDedId} className="text-xs font-semibold text-slate-700 ">
                    Other Deductions (80E, 80G, 80TTA)
                  </label>
                  <span className="text-[10px] text-slate-400">Education, Donations</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
<FormattedNumberInput
                    id={otherDedId}
                    type="number"
                    min="0"
                    value={deductions.otherDeductions || ""}
                    onChange={(e) => setDeductions({ ...deductions, otherDeductions: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200  bg-slate-50  text-slate-900  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100  flex justify-between items-center text-xs text-slate-600 ">
              <span>Total Deductions Claimed (incl. Std. Deduction):</span>
              <span className="font-bold text-slate-900 ">{formatRupee(totalOldDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Right Summary: Side-by-Side Comparison (5 Cols) */}
        <div style={{display:validationError?"none":undefined}} className="lg:col-span-5 min-w-0 space-y-6">
          {/* Estimate comparison Banner */}
          <div
            className={`p-5 rounded-lg border ${
              isSame
                ? "bg-slate-50  border-slate-200 "
                : isNewBetter
                ? "bg-emerald-50/70  border-emerald-200 "
                : "bg-indigo-50/70  border-indigo-200 "
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-md ${
                  isNewBetter
                    ? "bg-emerald-100  text-emerald-600 "
                    : isOldBetter
                    ? "bg-indigo-100  text-indigo-600 "
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isNewBetter ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 ">
                  Estimate comparison
                </span>
                <h3 className="text-lg font-extrabold text-slate-900  mt-0.5">
                  {isSame
                    ? "Both Regimes Yield the Same Tax"
                    : isNewBetter
                    ? "New regime has the lower estimate"
                    : "Old regime has the lower estimate"}
                </h3>
                <p className="text-sm text-slate-600  mt-1">
                  {isSame ? (
                    "Your tax liability is identical in both tax regimes."
                  ) : (
                    <>
                      Estimated difference:{" "}
                      <span className="font-extrabold text-emerald-600 ">
                        {formatRupee(difference)}
                      </span>{" "}
                      with the {isNewBetter ? "new regime" : "old regime"} estimate.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Side by side comparison cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* New Regime Card */}
            <div
              className={`p-5 rounded-lg border transition-all ${
                isNewBetter
                  ? "bg-white  border-emerald-500 shadow-none ring-2 ring-emerald-500/20"
                  : "bg-white  border-slate-200 "
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100  text-slate-700 ">
                  Default Regime
                </span>
                {isNewBetter && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700  ">
                    Saves More
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-500 ">
                New Regime
              </h4>
              <div className="text-2xl font-black text-slate-900  mt-1">
                {formatRupee(newResult.totalTax)}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100  space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 ">
                  <span>Gross Total:</span>
                  <span className="font-medium text-slate-800 ">{formatRupee(totalGross)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Std. Deduction:</span>
                  <span className="font-medium text-slate-800 ">-{formatRupee(standardDeductionNew)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Taxable Income:</span>
                  <span className="font-medium text-slate-800 ">{formatRupee(taxableIncomeNew)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Rebate 87A:</span>
                  <span className="font-medium text-emerald-600 ">-{formatRupee(newResult.rebate87A)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Health & Edu Cess:</span>
                  <span className="font-medium text-slate-800 ">{formatRupee(newResult.cess)}</span>
                </div>
              </div>
            </div>

            {/* Old Regime Card */}
            <div
              className={`p-5 rounded-lg border transition-all ${
                isOldBetter
                  ? "bg-white  border-indigo-500 shadow-none ring-2 ring-indigo-500/20"
                  : "bg-white  border-slate-200 "
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100  text-slate-700 ">
                  Optional
                </span>
                {isOldBetter && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700  ">
                    Saves More
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-500 ">
                Old Regime
              </h4>
              <div className="text-2xl font-black text-slate-900  mt-1">
                {formatRupee(oldResult.totalTax)}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100  space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 ">
                  <span>Gross Total:</span>
                  <span className="font-medium text-slate-800 ">{formatRupee(totalGross)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>All Deductions:</span>
                  <span className="font-medium text-slate-800 ">-{formatRupee(totalOldDeductions)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Taxable Income:</span>
                  <span className="font-medium text-slate-800 ">{formatRupee(taxableIncomeOld)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Rebate 87A:</span>
                  <span className="font-medium text-emerald-600 ">-{formatRupee(oldResult.rebate87A)}</span>
                </div>
                <div className="flex justify-between text-slate-500 ">
                  <span>Health & Edu Cess:</span>
                  <span className="font-medium text-slate-800 ">{formatRupee(oldResult.cess)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Related Calculators */}
          <div className="bg-slate-50  rounded-lg border border-slate-200  p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500  mb-3">
              Popular Financial Calculators
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
              <Link
                href="/compound-interest-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white  hover:text-violet-600 font-medium border border-slate-100  transition-colors"
              >
                <TrendingDown className="w-3.5 h-3.5 text-violet-500" />
                <span>Compound Interest</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-900">New regime slabs: {financialYear==="FY2025-26"?"FY 2025–26 / AY 2026–27":"FY 2024–25 / AY 2025–26"}</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full max-w-2xl text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Taxable income range</th><th>Rate</th></tr></thead><tbody>
          {newTaxSlabs(financialYear).map(([ceiling,slabRate],index,slabs)=><tr key={index} className="border-b border-slate-100"><td className="py-2">{index?formatRupee(slabs[index-1][0]):"₹0"} – {Number.isFinite(ceiling)?formatRupee(ceiling):"and above"}</td><td>{slabRate*100}%</td></tr>)}
        </tbody></table></div>
        <p className="mt-4 max-w-4xl text-xs leading-5 text-slate-500">Estimate for resident individuals with ordinary salary and slab-rate income, not filing advice. Only the selected financial year is covered. Capital gains, special-rate income, agricultural income, surcharge, employer NPS deductions and other special cases are not modeled. Enter only eligible deductions, including eligible family/parent insurance under 80D. Standard deductions are limited to salary. Rebate and marginal relief apply before 4% cess. <a className="underline" href={financialYear==="FY2025-26"?"https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1":"https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3"} target="_blank" rel="noreferrer">Income Tax Department tables</a></p>
      </section>
    </div>
  );
}

