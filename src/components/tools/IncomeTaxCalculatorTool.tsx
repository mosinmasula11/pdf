"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  Coins,
  ShieldCheck,
  TrendingDown,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Building2,
  Receipt,
  HelpCircle,
} from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<"summary" | "detailed" | "slabs">("summary");

  // Calculations
  const isSalaried = taxpayerType === "salaried";
  const standardDeductionNew = isSalaried ? 75000 : 0;
  const standardDeductionOld = isSalaried ? 50000 : 0;

  const totalGross = (Number(grossIncome) || 0) + (Number(otherIncome) || 0);

  // Old Regime Deductions
  const capped80C = Math.min(Math.max(0, deductions.sec80C), 150000);
  const capped80D = Math.min(Math.max(0, deductions.sec80D), ageCategory === "below60" ? 50000 : 100000);
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

  // Slabs computation for Old Regime
  const computeOldRegimeTax = (taxable: number, age: "below60" | "60to80" | "above80") => {
    let tax = 0;
    const slab1Limit = age === "above80" ? 500000 : age === "60to80" ? 300000 : 250000;

    if (taxable > 1000000) {
      tax += (taxable - 1000000) * 0.3;
      tax += (1000000 - 500000) * 0.2;
      tax += (500000 - slab1Limit) * 0.05;
    } else if (taxable > 500000) {
      tax += (taxable - 500000) * 0.2;
      tax += (500000 - slab1Limit) * 0.05;
    } else if (taxable > slab1Limit) {
      tax += (taxable - slab1Limit) * 0.05;
    }

    // 87A rebate for old regime: up to 5 Lakh taxable income
    let rebate87A = 0;
    if (taxable <= 500000) {
      rebate87A = Math.min(tax, 12500);
    }
    const taxAfterRebate = Math.max(0, tax - rebate87A);

    // Surcharge
    let surchargeRate = 0;
    if (taxable > 50000000) surchargeRate = 0.37;
    else if (taxable > 20000000) surchargeRate = 0.25;
    else if (taxable > 10000000) surchargeRate = 0.15;
    else if (taxable > 5000000) surchargeRate = 0.1;
    const surcharge = taxAfterRebate * surchargeRate;

    // Cess 4%
    const cess = (taxAfterRebate + surcharge) * 0.04;
    const totalTax = Math.round(taxAfterRebate + surcharge + cess);

    return {
      baseTax: tax,
      rebate87A,
      taxAfterRebate,
      surcharge,
      cess,
      totalTax,
    };
  };

  // Slabs computation for New Regime (Budget 2024 revisions)
  const computeNewRegimeTax = (taxable: number) => {
    let tax = 0;
    if (taxable > 1500000) {
      tax += (taxable - 1500000) * 0.3;
      tax += 300000 * 0.2; // 12-15L
      tax += 200000 * 0.15; // 10-12L
      tax += 300000 * 0.1; // 7-10L
      tax += 400000 * 0.05; // 3-7L
    } else if (taxable > 1200000) {
      tax += (taxable - 1200000) * 0.2;
      tax += 200000 * 0.15;
      tax += 300000 * 0.1;
      tax += 400000 * 0.05;
    } else if (taxable > 1000000) {
      tax += (taxable - 1000000) * 0.15;
      tax += 300000 * 0.1;
      tax += 400000 * 0.05;
    } else if (taxable > 700000) {
      tax += (taxable - 700000) * 0.1;
      tax += 400000 * 0.05;
    } else if (taxable > 300000) {
      tax += (taxable - 300000) * 0.05;
    }

    // 87A rebate for new regime: up to 7 Lakh taxable income gets rebate up to ₹25,000
    let rebate87A = 0;
    if (taxable <= 700000) {
      rebate87A = Math.min(tax, 25000);
    }

    // Marginal relief for New Regime if taxable income slightly exceeds 7,00,000
    let taxAfterRebate = Math.max(0, tax - rebate87A);
    if (taxable > 700000 && taxable <= 727777) {
      const excessIncome = taxable - 700000;
      if (taxAfterRebate > excessIncome) {
        taxAfterRebate = excessIncome;
      }
    }

    // Surcharge
    let surchargeRate = 0;
    if (taxable > 20000000) surchargeRate = 0.25;
    else if (taxable > 10000000) surchargeRate = 0.15;
    else if (taxable > 5000000) surchargeRate = 0.1;
    const surcharge = taxAfterRebate * surchargeRate;

    // Cess 4%
    const cess = (taxAfterRebate + surcharge) * 0.04;
    const totalTax = Math.round(taxAfterRebate + surcharge + cess);

    return {
      baseTax: tax,
      rebate87A,
      taxAfterRebate,
      surcharge,
      cess,
      totalTax,
    };
  };

  const oldResult = computeOldRegimeTax(taxableIncomeOld, ageCategory);
  const newResult = computeNewRegimeTax(taxableIncomeNew);

  const difference = Math.abs(oldResult.totalTax - newResult.totalTax);
  const isNewBetter = newResult.totalTax < oldResult.totalTax;
  const isOldBetter = oldResult.totalTax < newResult.totalTax;
  const isSame = newResult.totalTax === oldResult.totalTax;

  const formatRupee = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Title & Badges */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Updated for FY 2024-25 & FY 2025-26 Budget Slabs</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Income Tax Calculator
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Compare <strong>New Tax Regime vs Old Tax Regime</strong> side-by-side with deductions (80C, 80D, HRA, NPS) and find out how much tax you save.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span>1. Basic Income Details</span>
            </h2>

            {/* FY & Profile selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Financial Year
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFinancialYear("FY2024-25")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      financialYear === "FY2024-25"
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    2024-25
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialYear("FY2025-26")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      financialYear === "FY2025-26"
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    2025-26
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Employment Type
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTaxpayerType("salaried")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      taxpayerType === "salaried"
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Salaried
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxpayerType("individual")}
                    className={`py-1.5 rounded-md text-center transition-all ${
                      taxpayerType === "individual"
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Self-Employed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Age Category
                </label>
                <select
                  value={ageCategory}
                  onChange={(e) => setAgeCategory(e.target.value as "below60" | "60to80" | "above80")}
                  className="w-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg py-2.5 px-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500"
                >
                  <option value="below60">&lt; 60 Years (General)</option>
                  <option value="60to80">60 - 80 Years (Senior)</option>
                  <option value="above80">&gt; 80 Years (Super Senior)</option>
                </select>
              </div>
            </div>

            {/* Income Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={grossSalaryId} className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Gross Annual Income (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={grossSalaryId}
                    type="number"
                    min="0"
                    step="10000"
                    value={grossIncome || ""}
                    onChange={(e) => setGrossIncome(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. 12,00,000"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  CTC / Total salary before standard deductions
                </p>
              </div>

              <div>
                <label htmlFor={otherIncomeId} className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Income from Other Sources (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={otherIncomeId}
                    type="number"
                    min="0"
                    step="5000"
                    value={otherIncome || ""}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. 50,000"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Bank interest, rental income, capital gains, etc.
                </p>
              </div>
            </div>
          </div>

          {/* Old Regime Deductions Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Deductions (Applicable to Old Regime)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Standard deduction of {formatRupee(standardDeductionOld)} (Old) & {formatRupee(standardDeductionNew)} (New) is automatically applied.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={sec80CId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Section 80C (PPF, ELSS, EPF, LIC)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹1.5L</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={sec80CId}
                    type="number"
                    min="0"
                    max="150000"
                    value={deductions.sec80C || ""}
                    onChange={(e) => setDeductions({ ...deductions, sec80C: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={sec80DId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Section 80D (Health Insurance)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹25k - ₹1L</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={sec80DId}
                    type="number"
                    min="0"
                    value={deductions.sec80D || ""}
                    onChange={(e) => setDeductions({ ...deductions, sec80D: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={hraId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    HRA Exemption
                  </label>
                  <span className="text-[10px] text-slate-400">House Rent Allowance</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={hraId}
                    type="number"
                    min="0"
                    value={deductions.hra || ""}
                    onChange={(e) => setDeductions({ ...deductions, hra: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={homeLoanId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sec 24(b) (Home Loan Interest)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹2L</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={homeLoanId}
                    type="number"
                    min="0"
                    max="200000"
                    value={deductions.homeLoanInterest || ""}
                    onChange={(e) => setDeductions({ ...deductions, homeLoanInterest: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={npsId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    NPS 80CCD(1B)
                  </label>
                  <span className="text-[10px] text-slate-400">Max ₹50,000</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={npsId}
                    type="number"
                    min="0"
                    max="50000"
                    value={deductions.nps80CCD || ""}
                    onChange={(e) => setDeductions({ ...deductions, nps80CCD: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={otherDedId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Other Deductions (80E, 80G, 80TTA)
                  </label>
                  <span className="text-[10px] text-slate-400">Education, Donations</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    id={otherDedId}
                    type="number"
                    min="0"
                    value={deductions.otherDeductions || ""}
                    onChange={(e) => setDeductions({ ...deductions, otherDeductions: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span>Total Deductions Claimed (incl. Std. Deduction):</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupee(totalOldDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Right Summary: Side-by-Side Comparison (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recommendation Banner */}
          <div
            className={`p-5 rounded-2xl border ${
              isSame
                ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                : isNewBetter
                ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isNewBetter
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300"
                    : isOldBetter
                    ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300"
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
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recommendation
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {isSame
                    ? "Both Regimes Yield the Same Tax"
                    : isNewBetter
                    ? "New Tax Regime is Better for You"
                    : "Old Tax Regime is Better for You"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {isSame ? (
                    "Your tax liability is identical in both tax regimes."
                  ) : (
                    <>
                      You will save{" "}
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupee(difference)}
                      </span>{" "}
                      by choosing the {isNewBetter ? "New Regime" : "Old Regime"}.
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
              className={`p-5 rounded-2xl border transition-all ${
                isNewBetter
                  ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Default Regime
                </span>
                {isNewBetter && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    Saves More
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                New Regime
              </h4>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatRupee(newResult.totalTax)}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Gross Total:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupee(totalGross)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Std. Deduction:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">-{formatRupee(standardDeductionNew)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Taxable Income:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupee(taxableIncomeNew)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Rebate 87A:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatRupee(newResult.rebate87A)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Health & Edu Cess:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupee(newResult.cess)}</span>
                </div>
              </div>
            </div>

            {/* Old Regime Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isOldBetter
                  ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Optional
                </span>
                {isOldBetter && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    Saves More
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Old Regime
              </h4>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatRupee(oldResult.totalTax)}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Gross Total:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupee(totalGross)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>All Deductions:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">-{formatRupee(totalOldDeductions)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Taxable Income:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupee(taxableIncomeOld)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Rebate 87A:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatRupee(oldResult.rebate87A)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Health & Edu Cess:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupee(oldResult.cess)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Related Calculators */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Popular Financial Calculators
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
              <Link
                href="/compound-interest-calculator"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:text-violet-600 font-medium border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <TrendingDown className="w-3.5 h-3.5 text-violet-500" />
                <span>Compound Interest</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slabs Breakdown Accordion / Guide */}
      <div className="mt-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Income Tax Slab Rates for FY 2024-25 / AY 2025-26
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3">
              New Tax Regime Slabs (Budget 2024 Revision)
            </h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                    <th className="py-2 font-semibold">Income Slab</th>
                    <th className="py-2 font-semibold">Tax Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2">₹0 - ₹3,00,000</td>
                    <td className="py-2 font-semibold text-emerald-600">Nil (0%)</td>
                  </tr>
                  <tr>
                    <td className="py-2">₹3,00,001 - ₹7,00,000</td>
                    <td className="py-2 font-semibold">5%</td>
                  </tr>
                  <tr>
                    <td className="py-2">₹7,00,001 - ₹10,00,000</td>
                    <td className="py-2 font-semibold">10%</td>
                  </tr>
                  <tr>
                    <td className="py-2">₹10,00,001 - ₹12,00,000</td>
                    <td className="py-2 font-semibold">15%</td>
                  </tr>
                  <tr>
                    <td className="py-2">₹12,00,001 - ₹15,00,000</td>
                    <td className="py-2 font-semibold">20%</td>
                  </tr>
                  <tr>
                    <td className="py-2">Above ₹15,00,000</td>
                    <td className="py-2 font-semibold text-rose-500">30%</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                * Zero tax for total taxable income up to ₹7,00,000 thanks to Section 87A rebate. Salaried employees also get a ₹75,000 standard deduction.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
              Old Tax Regime Slabs
            </h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                    <th className="py-2 font-semibold">Income Slab</th>
                    <th className="py-2 font-semibold">Tax Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2">₹0 - ₹2,50,000</td>
                    <td className="py-2 font-semibold text-emerald-600">Nil (0%)</td>
                  </tr>
                  <tr>
                    <td className="py-2">₹2,50,001 - ₹5,00,000</td>
                    <td className="py-2 font-semibold">5%</td>
                  </tr>
                  <tr>
                    <td className="py-2">₹5,00,001 - ₹10,00,000</td>
                    <td className="py-2 font-semibold">20%</td>
                  </tr>
                  <tr>
                    <td className="py-2">Above ₹10,00,000</td>
                    <td className="py-2 font-semibold text-rose-500">30%</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                * Zero tax for taxable income up to ₹5,00,000 after claiming all eligible deductions like 80C, 80D, HRA, and Home loan interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

