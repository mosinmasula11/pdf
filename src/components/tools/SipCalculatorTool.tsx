"use client";

import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

import { useState } from "react";
import { boundedYears, calculatorError, loanRepayment, recurringFutureValue } from "@/lib/calculator-math";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Table as TableIcon,
} from "lucide-react";

export type CalculatorType =
  | "sip"
  | "lumpsum"
  | "swp"
  | "fd"
  | "rd"
  | "emi"
  | "ppf"
  | "gst"
  | "cagr";

export function formatIndianCurrency(num: number): string {
  if (isNaN(num) || !isFinite(num)) return "₹0";
  return "₹" + Math.round(num).toLocaleString("en-IN");
}

export function SipCalculatorTool({ defaultType = "sip" }: { defaultType?: CalculatorType }) {
  const [calcType, setCalcType] = useState<CalculatorType>(defaultType);
  const { money: formatIndianCurrency, symbol } = useCurrencyFormat(calcType === "ppf" || calcType === "gst");

  // SIP States
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);
  const [sipReturnRate, setSipReturnRate] = useState<number>(12);
  const [sipTimePeriod, setSipTimePeriod] = useState<number>(10);

  // Lumpsum States
  const [lumpsumInvestment, setLumpsumInvestment] = useState<number>(100000);
  const [lumpsumReturnRate, setLumpsumReturnRate] = useState<number>(12);
  const [lumpsumTimePeriod, setLumpsumTimePeriod] = useState<number>(10);

  // SWP States
  const [swpTotalInvestment, setSwpTotalInvestment] = useState<number>(1000000);
  const [swpMonthlyWithdrawal, setSwpMonthlyWithdrawal] = useState<number>(10000);
  const [swpReturnRate, setSwpReturnRate] = useState<number>(8);
  const [swpTimePeriod, setSwpTimePeriod] = useState<number>(10);

  // FD States
  const [fdInvestment, setFdInvestment] = useState<number>(100000);
  const [fdRate, setFdRate] = useState<number>(7.1);
  const [fdYears, setFdYears] = useState<number>(5);

  // RD States
  const [rdMonthly, setRdMonthly] = useState<number>(5000);
  const [rdRate, setRdRate] = useState<number>(6.8);
  const [rdYears, setRdYears] = useState<number>(5);

  // EMI States
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(9.5);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(15);

  // PPF States
  const [ppfYearly, setPpfYearly] = useState<number>(150000);
  const ppfRate = 7.1; // Standard PPF rate
  const [ppfYears, setPpfYears] = useState<number>(15);

  // GST States
  const [gstAmount, setGstAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstMode, setGstMode] = useState<"exclusive" | "inclusive">("exclusive");

  // Show yearly breakdown schedule
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // -------------------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------------------

  // 1. SIP Calculation
  // M = P * [ (1+i)^n - 1 ] / i * (1+i)
  const sipMonths = sipTimePeriod * 12;
  const sipInvestedAmount = monthlyInvestment * sipMonths;
  const sipTotalValue = recurringFutureValue(monthlyInvestment, sipReturnRate, sipMonths);
  const sipEstReturns = Math.max(0, sipTotalValue - sipInvestedAmount);

  // 2. Lumpsum Calculation
  // A = P * (1 + r)^t
  const lumpsumInvestedAmount = lumpsumInvestment;
  const lumpsumTotalValue = lumpsumInvestment * Math.pow(1 + lumpsumReturnRate / 100, lumpsumTimePeriod);
  const lumpsumEstReturns = Math.max(0, lumpsumTotalValue - lumpsumInvestedAmount);

  // 3. SWP Calculation
  let swpCurrentBalance = swpTotalInvestment;
  const swpMonthlyRate = swpReturnRate / 12 / 100;
  const swpTotalMonths = boundedYears(swpTimePeriod) * 12;
  let swpTotalWithdrawn = 0;
  for (let m = 1; m <= swpTotalMonths; m++) {
    const interest = swpCurrentBalance * swpMonthlyRate;
    swpCurrentBalance = swpCurrentBalance + interest - swpMonthlyWithdrawal;
    if (swpCurrentBalance < 0) {
      swpTotalWithdrawn += swpMonthlyWithdrawal + swpCurrentBalance;
      swpCurrentBalance = 0;
      break;
    } else {
      swpTotalWithdrawn += swpMonthlyWithdrawal;
    }
  }
  const swpFinalValue = Math.max(0, swpCurrentBalance);

  // 4. FD Calculation (Quarterly compounding)
  const fdInvestedAmount = fdInvestment;
  const fdTotalValue = fdInvestment * Math.pow(1 + fdRate / 400, 4 * fdYears);
  const fdEstReturns = Math.max(0, fdTotalValue - fdInvestedAmount);

  // 5. RD Calculation
  const rdMonths = boundedYears(rdYears) * 12;
  const rdInvestedAmount = rdMonthly * rdMonths;
  // Quarterly compounded formula for Indian RDs
  let rdTotalValue = 0;
  for (let i = 1; i <= rdMonths; i++) {
    const quartersRemaining = (rdMonths - i + 1) / 3;
    rdTotalValue += rdMonthly * Math.pow(1 + rdRate / 400, quartersRemaining);
  }
  const rdEstReturns = Math.max(0, rdTotalValue - rdInvestedAmount);

  // 6. EMI Calculation
  const emiMonths = loanTenureYears * 12;
  const repayment = loanRepayment(loanAmount, loanInterestRate, emiMonths);
  const emiPerMonth = repayment.monthly;
  const emiTotalPayment = repayment.total;
  const emiTotalInterest = repayment.interest;

  // 7. PPF Calculation (Compounded annually on 15 years)
  let ppfCurrent = 0;
  for (let y = 1; y <= boundedYears(ppfYears); y++) {
    ppfCurrent = (ppfCurrent + ppfYearly) * (1 + ppfRate / 100);
  }
  const ppfInvestedAmount = ppfYearly * ppfYears;
  const ppfTotalValue = ppfCurrent;
  const ppfEstReturns = Math.max(0, ppfTotalValue - ppfInvestedAmount);

  // 8. GST Calculation
  let gstCalculatedTax = 0;
  let gstNetTotal = 0;
  if (gstMode === "exclusive") {
    // Add GST
    gstCalculatedTax = (gstAmount * gstRate) / 100;
    gstNetTotal = gstAmount + gstCalculatedTax;
  } else {
    // Remove GST
    gstNetTotal = gstAmount / (1 + gstRate / 100);
    gstCalculatedTax = gstAmount - gstNetTotal;
  }

  // Determine current active metrics for display & donut chart
  let activeInvested = sipInvestedAmount;
  let activeReturns = sipEstReturns;
  let activeTotal = sipTotalValue;
  let labelInvested = "Invested amount";
  let labelReturns = "Est. returns";
  let labelTotal = "Total value";

  if (calcType === "lumpsum") {
    activeInvested = lumpsumInvestedAmount;
    activeReturns = lumpsumEstReturns;
    activeTotal = lumpsumTotalValue;
  } else if (calcType === "swp") {
    activeInvested = swpTotalWithdrawn;
    activeReturns = swpFinalValue;
    activeTotal = swpTotalWithdrawn + swpFinalValue;
    labelInvested = "Total withdrawal";
    labelReturns = "Final value";
    labelTotal = "Total value";
  } else if (calcType === "fd") {
    activeInvested = fdInvestedAmount;
    activeReturns = fdEstReturns;
    activeTotal = fdTotalValue;
  } else if (calcType === "rd") {
    activeInvested = rdInvestedAmount;
    activeReturns = rdEstReturns;
    activeTotal = rdTotalValue;
  } else if (calcType === "emi") {
    activeInvested = loanAmount;
    activeReturns = emiTotalInterest;
    activeTotal = emiTotalPayment;
    labelInvested = "Principal loan amount";
    labelReturns = "Total interest";
    labelTotal = "Total amount payable";
  } else if (calcType === "ppf") {
    activeInvested = ppfInvestedAmount;
    activeReturns = ppfEstReturns;
    activeTotal = ppfTotalValue;
  } else if (calcType === "gst") {
    activeInvested = gstMode === "exclusive" ? gstAmount : gstNetTotal;
    activeReturns = gstCalculatedTax;
    activeTotal = gstMode === "exclusive" ? gstNetTotal : gstAmount;
    labelInvested = "Base amount";
    labelReturns = "GST amount";
    labelTotal = "Total gross amount";
  }

  const validationError = calculatorError(({
    sip: [{ label: "Monthly investment", value: monthlyInvestment, min: 500, max: 200000 }, { label: "Expected return rate", value: sipReturnRate, min: 0, max: 30 }, { label: "Time period", value: sipTimePeriod, min: 1, max: 35, whole: true }],
    lumpsum: [{ label: "Total investment", value: lumpsumInvestment, min: 1000, max: 1000000 }, { label: "Expected return rate", value: lumpsumReturnRate, min: 0, max: 30 }, { label: "Time period", value: lumpsumTimePeriod, min: 1, max: 35, whole: true }],
    emi: [{ label: "Loan amount", value: loanAmount, min: 1, max: 10000000 }, { label: "Rate of interest", value: loanInterestRate, min: 0, max: 20 }, { label: "Loan tenure", value: loanTenureYears, min: 1, max: 30, whole: true }],
    fd: [{ label: "Total investment", value: fdInvestment, min: 1, max: 1000000 }, { label: "Rate of interest", value: fdRate, min: 0, max: 12 }, { label: "Time period", value: fdYears, min: 1, max: 10, whole: true }],
    swp: [{ label: "Total Investment", value: swpTotalInvestment, min: 1, max: 100000000 }, { label: "Monthly Withdrawal", value: swpMonthlyWithdrawal, min: 1, max: 10000000 }, { label: "Expected Return Rate", value: swpReturnRate, min: 0, max: 30 }, { label: "Time Period", value: swpTimePeriod, min: 1, max: 50, whole: true }],
    rd: [{ label: "Monthly Deposit", value: rdMonthly, min: 1, max: 10000000 }, { label: "Rate of Interest", value: rdRate, min: 0, max: 30 }, { label: "Tenure", value: rdYears, min: 1, max: 50, whole: true }],
    ppf: [{ label: "Yearly Investment", value: ppfYearly, min: 500, max: 150000 }, { label: "Time Period", value: ppfYears, min: 15, max: 50, whole: true }],
    gst: [{ label: "Amount", value: gstAmount, min: 0, max: 100000000 }],
    cagr: [],
  })[calcType]);

  if (validationError) { activeInvested = 0; activeReturns = 0; activeTotal = 0; }

  // Donut chart math
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const investedRatio = activeTotal > 0 ? activeInvested / activeTotal : 0;
  const returnsRatio = activeTotal > 0 ? activeReturns / activeTotal : 0;
  const investedStroke = investedRatio * circumference;
  const returnsStroke = returnsRatio * circumference;

  // Yearly schedule generator for SIP
  const yearlySchedule = [];
  if (calcType === "sip") {
    for (let yr = 1; yr <= boundedYears(sipTimePeriod); yr++) {
      const monthsCount = yr * 12;
      const inv = monthlyInvestment * monthsCount;
      const val = recurringFutureValue(monthlyInvestment, sipReturnRate, monthsCount);
      yearlySchedule.push({
        year: yr,
        invested: inv,
        returns: val - inv,
        total: val,
      });
    }
  }

  const popularCalculators = [
    { id: "sip", name: "SIP Calculator" },
    { id: "lumpsum", name: "Lumpsum Calculator" },
    { id: "swp", name: "SWP Calculator" },
    { id: "fd", name: "FD Calculator" },
    { id: "rd", name: "RD Calculator" },
    { id: "emi", name: "EMI Calculator" },
    { id: "ppf", name: "PPF Calculator" },
    { id: "gst", name: "GST Calculator" },
  ];

  return (
    <div className="space-y-10">
      {/* Main Grid: Calculator on Left, Popular on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Calculator Card (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
          {/* Top Switcher (SIP / Lumpsum tabs) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setCalcType("sip")}
              className={`rounded-lg px-6 py-2 text-xs font-bold transition ${
                calcType === "sip"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              SIP
            </button>
            <button
              type="button"
              onClick={() => setCalcType("lumpsum")}
              className={`rounded-lg px-6 py-2 text-xs font-bold transition ${
                calcType === "lumpsum"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lumpsum
            </button>
            {calcType !== "sip" && calcType !== "lumpsum" && (
              <span className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm capitalize">
                {calcType.toUpperCase()}
              </span>
            )}
          </div>

          {/* Interactive Sliders Section */}
          <div className="space-y-6">
            {/* 1. SIP Inputs */}
            {calcType === "sip" && (
              <>
                {/* Monthly Investment */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Monthly investment</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<span>{symbol}</span>
<FormattedNumberInput
                        type="number"
                        aria-label="Monthly investment"
                        aria-invalid={!!validationError}
                        min={500}
                        max={200000}
                        step="any"
                        value={monthlyInvestment}
                        onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                        className="w-24 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Monthly investment slider"
                        aria-invalid={!!validationError}
                        min={500}
                        max={200000}
                        value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{formatIndianCurrency(500)}</span>
                    <span>{formatIndianCurrency(100000)}</span>
                    <span>{formatIndianCurrency(200000)}</span>
                  </div>
                </div>

                {/* Expected Return Rate */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Expected return rate (p.a)</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Expected return rate"
                        aria-invalid={!!validationError}
                        min={0}
                        max={30}
                        step="any"
                        value={sipReturnRate}
                        onChange={(e) => setSipReturnRate(Number(e.target.value))}
                        className="w-16 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Expected return rate slider"
                        aria-invalid={!!validationError}
                        min={0}
                        max={30}
                        value={sipReturnRate}
                    onChange={(e) => setSipReturnRate(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>0%</span>
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Time Period */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Time period</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Time period"
                        aria-invalid={!!validationError}
                        min={1}
                        max={35}
                        step={1}
                        value={sipTimePeriod}
                        onChange={(e) => setSipTimePeriod(Number(e.target.value))}
                        className="w-12 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="ml-1 text-slate-500 font-normal">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step={1}
                    aria-label="Time period slider"
                        aria-invalid={!!validationError}
                        min={1}
                        max={35}
                        value={sipTimePeriod}
                    onChange={(e) => setSipTimePeriod(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1 Yr</span>
                    <span>15 Yr</span>
                    <span>35 Yr</span>
                  </div>
                </div>
              </>
            )}

            {/* 2. Lumpsum Inputs */}
            {calcType === "lumpsum" && (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Total investment</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<span>{symbol}</span>
<FormattedNumberInput
                        type="number"
                        aria-label="Total investment"
                        aria-invalid={!!validationError}
                        min={1000}
                        max={1000000}
                        step="any"
                        value={lumpsumInvestment}
                        onChange={(e) => setLumpsumInvestment(Number(e.target.value))}
                        className="w-28 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Total investment slider"
                        aria-invalid={!!validationError}
                        min={1000}
                        max={1000000}
                        value={lumpsumInvestment}
                    onChange={(e) => setLumpsumInvestment(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Expected return rate (p.a)</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Expected return rate"
                        aria-invalid={!!validationError}
                        min={0}
                        max={30}
                        step="any"
                        value={lumpsumReturnRate}
                        onChange={(e) => setLumpsumReturnRate(Number(e.target.value))}
                        className="w-16 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Expected return rate slider"
                        aria-invalid={!!validationError}
                        min={0}
                        max={30}
                        value={lumpsumReturnRate}
                    onChange={(e) => setLumpsumReturnRate(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Time period</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Time period"
                        aria-invalid={!!validationError}
                        min={1}
                        max={35}
                        step={1}
                        value={lumpsumTimePeriod}
                        onChange={(e) => setLumpsumTimePeriod(Number(e.target.value))}
                        className="w-12 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="ml-1 text-slate-500 font-normal">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step={1}
                    aria-label="Time period slider"
                        aria-invalid={!!validationError}
                        min={1}
                        max={35}
                        value={lumpsumTimePeriod}
                    onChange={(e) => setLumpsumTimePeriod(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* 3. EMI Inputs */}
            {calcType === "emi" && (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Loan amount</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<span>{symbol}</span>
<FormattedNumberInput
                        type="number"
                        aria-label="Loan amount"
                        aria-invalid={!!validationError}
                        min={1}
                        max={10000000}
                        step="any"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-28 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Loan amount slider"
                        aria-invalid={!!validationError}
                        min={1}
                        max={10000000}
                        value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Rate of interest (p.a)</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Rate of interest"
                        aria-invalid={!!validationError}
                        min={0}
                        max={20}
                        step="any"
                        value={loanInterestRate}
                        onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                        className="w-16 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Rate of interest slider"
                        aria-invalid={!!validationError}
                        min={0}
                        max={20}
                        value={loanInterestRate}
                    onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Loan tenure</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Loan tenure"
                        aria-invalid={!!validationError}
                        min={1}
                        max={30}
                        step={1}
                        value={loanTenureYears}
                        onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                        className="w-12 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="ml-1 text-slate-500 font-normal">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step={1}
                    aria-label="Loan tenure slider"
                        aria-invalid={!!validationError}
                        min={1}
                        max={30}
                        value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* 4. FD Inputs */}
            {calcType === "fd" && (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Total investment</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<span>{symbol}</span>
<FormattedNumberInput
                        type="number"
                        aria-label="Total investment"
                        aria-invalid={!!validationError}
                        min={1}
                        max={1000000}
                        step="any"
                        value={fdInvestment}
                        onChange={(e) => setFdInvestment(Number(e.target.value))}
                        className="w-28 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Total investment slider"
                        aria-invalid={!!validationError}
                        min={1}
                        max={1000000}
                        value={fdInvestment}
                    onChange={(e) => setFdInvestment(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Rate of interest (p.a)</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Rate of interest"
                        aria-invalid={!!validationError}
                        min={0}
                        max={12}
                        step="any"
                        value={fdRate}
                        onChange={(e) => setFdRate(Number(e.target.value))}
                        className="w-16 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step="any"
                    aria-label="Rate of interest slider"
                        aria-invalid={!!validationError}
                        min={0}
                        max={12}
                        value={fdRate}
                    onChange={(e) => setFdRate(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Time period</label>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sm text-violet-700">
<FormattedNumberInput
                        type="number"
                        aria-label="Time period"
                        aria-invalid={!!validationError}
                        min={1}
                        max={10}
                        step={1}
                        value={fdYears}
                        onChange={(e) => setFdYears(Number(e.target.value))}
                        className="w-12 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="ml-1 text-slate-500 font-normal">Yr</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    step={1}
                    aria-label="Time period slider"
                        aria-invalid={!!validationError}
                        min={1}
                        max={10}
                        value={fdYears}
                    onChange={(e) => setFdYears(Number(e.target.value))}
                    className="w-full h-2 rounded-lg accent-violet-600 bg-slate-200 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Other calculators (SWP, RD, PPF, GST) simple controls */}
            {calcType === "swp" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span>Total Investment</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Total Investment"
                        aria-invalid={!!validationError}
                        min={1}
                        max={100000000}
                        step="any"
                        value={swpTotalInvestment}
                    onChange={(e) => setSwpTotalInvestment(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-32"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Monthly Withdrawal</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Monthly Withdrawal"
                        aria-invalid={!!validationError}
                        min={1}
                        max={10000000}
                        step="any"
                        value={swpMonthlyWithdrawal}
                    onChange={(e) => setSwpMonthlyWithdrawal(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-32"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Expected Return Rate (%)</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Expected Return Rate"
                        aria-invalid={!!validationError}
                        min={0}
                        max={30}
                        step="any"
                        value={swpReturnRate}
                    onChange={(e) => setSwpReturnRate(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-20"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Time Period (Years)</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Time Period"
                        aria-invalid={!!validationError}
                        min={1}
                        max={50}
                        step={1}
                        value={swpTimePeriod}
                    onChange={(e) => setSwpTimePeriod(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-20"
                  />
                </div>
              </div>
            )}

            {calcType === "rd" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span>Monthly Deposit</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Monthly Deposit"
                        aria-invalid={!!validationError}
                        min={1}
                        max={10000000}
                        step="any"
                        value={rdMonthly}
                    onChange={(e) => setRdMonthly(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-32"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Rate of Interest (%)</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Rate of Interest"
                        aria-invalid={!!validationError}
                        min={0}
                        max={30}
                        step="any"
                        value={rdRate}
                    onChange={(e) => setRdRate(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-20"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Tenure (Years)</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Tenure"
                        aria-invalid={!!validationError}
                        min={1}
                        max={50}
                        step={1}
                        value={rdYears}
                    onChange={(e) => setRdYears(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-20"
                  />
                </div>
              </div>
            )}

            {calcType === "ppf" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span>Yearly Investment (Max ₹1.5L)</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Yearly Investment"
                        aria-invalid={!!validationError}
                        min={500}
                        max={150000}
                        step="any"
                        value={ppfYearly}
                    onChange={(e) => setPpfYearly(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-32"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Time Period (Years)</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Time Period"
                        aria-invalid={!!validationError}
                        min={15}
                        max={50}
                        step={1}
                        value={ppfYears}
                    onChange={(e) => setPpfYears(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-20"
                  />
                </div>
              </div>
            )}

            {calcType === "gst" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGstMode("exclusive")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      gstMode === "exclusive" ? "bg-violet-600 text-white" : "bg-slate-100"
                    }`}
                  >
                    Add GST (Exclusive)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstMode("inclusive")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      gstMode === "inclusive" ? "bg-violet-600 text-white" : "bg-slate-100"
                    }`}
                  >
                    Remove GST (Inclusive)
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Amount</span>
<FormattedNumberInput
                    type="number"
                    aria-label="Amount"
                        aria-invalid={!!validationError}
                        min={0}
                        max={100000000}
                        step="any"
                        value={gstAmount}
                    onChange={(e) => setGstAmount(Number(e.target.value))}
                    className="rounded border p-1 font-bold text-right w-32"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>GST Rate</span>
                  <div className="flex gap-1">
                    {[5, 12, 18, 28].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setGstRate(r)}
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          gstRate === r ? "bg-violet-600 text-white" : "bg-slate-100"
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {validationError && <p id="calculator-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{validationError}</p>}
          {/* Results Summary & Donut Chart Box */}
          <div style={{ display: validationError ? "none" : undefined }} className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Numeric Values (7 cols) */}
            <div className="sm:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">{labelInvested}</span>
                <span className="font-bold text-slate-800 text-base">
                  {formatIndianCurrency(activeInvested)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">{labelReturns}</span>
                <span className="font-bold text-slate-800 text-base">
                  {formatIndianCurrency(activeReturns)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-900 font-bold">{labelTotal}</span>
                <span className="font-black text-violet-700 text-xl">
                  {formatIndianCurrency(activeTotal)}
                </span>
              </div>

              {calcType === "emi" && emiPerMonth > 0 && (
                <div className="rounded-xl bg-violet-50 p-3 flex justify-between items-center text-xs font-bold text-violet-900">
                  <span>Monthly EMI Payable:</span>
                  <span className="text-sm font-black">{formatIndianCurrency(emiPerMonth)}</span>
                </div>
              )}
            </div>

            {/* Donut Chart (5 cols) */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] font-semibold mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-200" />
                  <span className="text-slate-500">{calcType === "emi" ? "Principal" : calcType === "gst" ? "Base" : calcType === "swp" ? "Withdrawn" : "Invested"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                  <span className="text-slate-500">{calcType === "emi" ? "Interest" : calcType === "gst" ? "Tax" : calcType === "swp" ? "Balance" : "Returns"}</span>
                </div>
              </div>

              {/* SVG Donut */}
              <div className="relative flex items-center justify-center">
                <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#ede9fe" // violet-100
                    strokeWidth="20"
                    fill="transparent"
                  />
                  {/* Invested Slice */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#c4b5fd" // violet-300
                    strokeWidth="20"
                    fill="transparent"
                    strokeDasharray={`${investedStroke} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  {/* Returns Slice */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#7c3aed" // violet-600
                    strokeWidth="20"
                    fill="transparent"
                    strokeDasharray={`${returnsStroke} ${circumference}`}
                    strokeDashoffset={`-${investedStroke}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>

                {/* Center text in Donut */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {calcType === "emi" ? "Interest" : calcType === "gst" ? "Tax" : calcType === "swp" ? "Balance" : "Returns"}
                  </span>
                  <span className="text-xs font-black text-violet-700">
                    {Math.round(returnsRatio * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Schedule Table Button */}
          {calcType === "sip" && !validationError && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSchedule(!showSchedule)}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700"
              >
                <TableIcon className="h-4 w-4" />
                <span>{showSchedule ? "Hide Yearly Growth Schedule" : "View Yearly Growth Schedule"}</span>
              </button>

              {showSchedule && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Year</th>
                        <th className="p-3">Invested Amount</th>
                        <th className="p-3">Estimated Returns</th>
                        <th className="p-3">Future Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {yearlySchedule.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50/80">
                          <td className="p-3 font-bold text-slate-900">Year {row.year}</td>
                          <td className="p-3 text-slate-600">{formatIndianCurrency(row.invested)}</td>
                          <td className="p-3 text-emerald-600 font-medium">+{formatIndianCurrency(row.returns)}</td>
                          <td className="p-3 font-bold text-violet-700">{formatIndianCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Popular Calculators Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Popular Calculators Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Popular Calculators
            </h3>

            <div className="space-y-1">
              {popularCalculators.map((calc) => (
                <button
                  key={calc.id}
                  type="button"
                  onClick={() => {
                    setCalcType(calc.id as CalculatorType);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition ${
                    calcType === calc.id
                      ? "bg-violet-50 text-violet-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{calc.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Info Box */}
          {calcType === "sip" && <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 shadow-sm space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-violet-900 font-bold">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span>Power of Compounding</span>
            </div>
            <p className="leading-relaxed">
              In a SIP, you invest a fixed sum at regular intervals. By reinvesting returns, compounding accelerates wealth creation significantly over longer horizons (10+ years).
            </p>
          </div>}
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500">Illustrative estimates only, not investment, loan or tax advice. Returns and rates may change. SIP assumes beginning-of-month deposits; FD and RD use quarterly compounding. PPF uses an assumed 7.1% annual rate and beginning-of-year contributions, not daily deposit timing. Taxes, fees and lender charges are excluded.</p>
      {calcType === "sip" && <>
      {/* SIP explanation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">
            SIP Calculator – Systematic Investment Plan Calculator
          </h2>
          <p className="text-sm">
            Prospective investors often wonder how small regular contributions grow over time. A <strong>SIP calculator</strong> helps you estimate potential returns when parking your money in wealth-building mutual fund instruments without requiring complex manual mathematics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">How does a SIP Calculator work?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A SIP calculator uses the compound interest compounding formula where each installment compounds continuously over the remaining investment duration:
            </p>
            <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-violet-200">
              M = P × [ (1 + i)ⁿ – 1 ] / i × (1 + i)
            </div>
            <ul className="text-xs space-y-1 text-slate-500 pt-1">
              <li><strong>M:</strong> Amount you receive upon maturity</li>
              <li><strong>P:</strong> Amount you invest monthly</li>
              <li><strong>i:</strong> Monthly interest rate (r / 12 / 100)</li>
              <li><strong>n:</strong> Total number of installments (years × 12)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">Benefits of SIP Investing</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Disciplined Investing:</strong> Automates monthly savings directly from your bank.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Rupee Cost Averaging:</strong> Buy more mutual fund units when markets dip and fewer when markets peak.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Low Entry Barrier:</strong> Start with as little as ₹500 per month without waiting for a large corpus.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}

