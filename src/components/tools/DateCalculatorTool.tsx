"use client";

import { useState, useEffect, useId } from "react";
import { dateSpan, shiftDate } from "@/lib/extended-calculators";
import { Copy, Check, Plus, Minus } from "lucide-react";

export function DateCalculatorTool() {
  const startDateId = useId();
  const endDateId = useId();
  const baseDateId = useId();

  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"difference" | "addSubtract">("difference");

  // Difference Mode
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(true);

  // Add / Subtract Mode
  const [baseDate, setBaseDate] = useState<string>("");
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState<number>(30);
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted=true;
    queueMicrotask(()=>{
    if(!mounted)return;
    const today=new Date();
    const future = new Date();
    future.setDate(today.getDate() + 30);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    setStartDate(fmt(today));
    setEndDate(fmt(future));
    setBaseDate(fmt(today));
    setReady(true);
    });
    return ()=>{mounted=false;};
  }, []);

  let validationError="";
  let span={totalDays:0,businessDays:0,weekendDays:0,weeksCount:0,monthsCount:0,yearsCount:0};
  let shifted={targetDateString:"",targetDayOfWeek:""};
  if(ready){try{if(activeTab==="difference")span=dateSpan(startDate,endDate,includeEndDay);else shifted=shiftDate(baseDate,amount,unit,operation);}catch(error){validationError=error instanceof Error?error.message:"Check the dates.";}}
  const {totalDays,businessDays,weekendDays,weeksCount,monthsCount}=span;
  const {targetDateString,targetDayOfWeek}=shifted;

  const copyResult = async (text: string) => {
    if (validationError) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="calculator-workspace w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900  tracking-normal">
          Date & Day Difference Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Compare calendar dates or move a date forward or backward.</p>
      </div>

      {validationError && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validationError}</p>}

      {/* Mode Switcher */}
      <div className="max-w-md mx-auto mb-8 bg-slate-100  p-1.5 rounded-md flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("difference")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "difference"
              ? "bg-white  text-violet-600  shadow-none"
              : "text-slate-600  hover:text-slate-900"
          }`}
        >
          Days Between Dates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("addSubtract")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "addSubtract"
              ? "bg-white  text-violet-600  shadow-none"
              : "text-slate-600  hover:text-slate-900"
          }`}
        >
          Add / Subtract Days
        </button>
      </div>

      {/* Tab 1: Days Between Dates */}
      {activeTab === "difference" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs */}
          <div className="lg:col-span-6 bg-white  rounded-lg border border-slate-200  p-6 shadow-none space-y-5">
            <h2 className="text-base font-bold text-slate-900  mb-2">
              Select Start and End Dates
            </h2>

            <div>
              <label htmlFor={startDateId} className="block text-xs font-semibold text-slate-600  mb-1.5">
                Start Date
              </label>
              <input
                id={startDateId}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor={endDateId} className="block text-xs font-semibold text-slate-600  mb-1.5">
                End Date
              </label>
              <input
                id={endDateId}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 ">
              <input
                type="checkbox"
                id="includeEndDay"
                checked={includeEndDay}
                onChange={(e) => setIncludeEndDay(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 accent-violet-600"
              />
              <label htmlFor="includeEndDay" className="text-xs font-medium text-slate-700 ">
                Include end day in calculation (adds 1 day)
              </label>
            </div>
          </div>

          {/* Results */}
          <div style={{display:validationError?"none":undefined}} className="lg:col-span-6 min-w-0 bg-white rounded-lg border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 ">
              <h2 className="text-base font-bold text-slate-900 ">
                Duration Summary
              </h2>
              <button
                type="button"
                onClick={() => copyResult(`${totalDays} days (${businessDays} working days)`)}
                className="text-xs text-slate-500 hover:text-slate-900  flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50  rounded-md text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Days
              </span>
              <div className="text-4xl font-black text-violet-600  mt-1">
                {totalDays} <span className="text-xl font-normal text-slate-600">days</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-md border border-slate-100  bg-slate-50 ">
                <span className="text-slate-400 block mb-1">💼 Business Days (Mon-Fri)</span>
                <span className="text-lg font-black text-slate-900 ">{businessDays} days</span>
              </div>
              <div className="p-3 rounded-md border border-slate-100  bg-slate-50 ">
                <span className="text-slate-400 block mb-1">🏖 Weekend Days</span>
                <span className="text-lg font-black text-slate-900 ">{weekendDays} days</span>
              </div>
              <div className="p-3 rounded-md border border-slate-100  bg-slate-50 ">
                <span className="text-slate-400 block mb-1">📅 Total Weeks</span>
                <span className="text-lg font-black text-slate-900 ">{weeksCount} weeks</span>
              </div>
              <div className="p-3 rounded-md border border-slate-100  bg-slate-50 ">
                <span className="text-slate-400 block mb-1">🗓 Approx Months</span>
                <span className="text-lg font-black text-slate-900 ">{monthsCount} months</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Add / Subtract Days */}
      {activeTab === "addSubtract" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white  rounded-lg border border-slate-200  p-6 shadow-none space-y-5">
            <h2 className="text-base font-bold text-slate-900  mb-2">
              Start Date & Offset
            </h2>

            <div>
              <label htmlFor={baseDateId} className="block text-xs font-semibold text-slate-600  mb-1.5">
                Starting Date
              </label>
              <input
                id={baseDateId}
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900  focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                Operation
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100  p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => setOperation("add")}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    operation === "add"
                      ? "bg-white  text-emerald-600 shadow-none"
                      : "text-slate-600 "
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperation("subtract")}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    operation === "subtract"
                      ? "bg-white  text-rose-600 shadow-none"
                      : "text-slate-600 "
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Subtract (-)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  aria-label="Amount"
                  placeholder="Enter a value"
                  value={Number.isFinite(amount) ? amount : ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600  mb-1.5">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "days" | "weeks" | "months" | "years")}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200  bg-slate-50  font-bold text-slate-900 "
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{display:validationError?"none":undefined}} className="lg:col-span-6 min-w-0 bg-white rounded-lg border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 ">
              <h2 className="text-base font-bold text-slate-900 ">
                Calculated Date
              </h2>
              <button
                type="button"
                onClick={() => copyResult(targetDateString)}
                className="text-xs text-slate-500 hover:text-slate-900  flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50  rounded-md text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Date
              </span>
              <div className="text-2xl font-black text-violet-600  mt-2">
                {targetDateString}
              </div>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100  text-violet-700 ">
                {targetDayOfWeek}
              </span>
            </div>
          </div>
        </div>
      )}
      <p className="mt-6 text-xs leading-5 text-slate-500">Weekdays exclude Saturdays and Sundays, not public holidays. Month/year duration totals are approximate. Month/year offsets keep the nearest valid day at month end.</p>
    </div>
  );
}

