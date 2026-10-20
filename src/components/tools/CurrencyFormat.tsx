"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { currencyFormats, formatMoney, validCurrency, type CurrencyFormat } from "@/lib/number-format";
const key = "msyn-currency-format";
let fallback: CurrencyFormat = "INR";
const listeners = new Set<() => void>();
function snapshot() { try { return validCurrency(localStorage.getItem(key) || fallback); } catch { return fallback; } }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {if(event.key===key || event.key===null) listener();};
  window.addEventListener("storage", storage);
  return () => {listeners.delete(listener);window.removeEventListener("storage", storage);};
}
export function useCurrencyFormat(fixedINR = false) {
  const currency = useSyncExternalStore(subscribe, snapshot, () => "INR" as CurrencyFormat);
  return {currency, symbol: fixedINR ? "₹" : currencyFormats[currency].symbol, money: (value: number, decimals=0) => formatMoney(value,currency,decimals,fixedINR)};
}
const paths = new Set(["number-to-words","in-hand-salary-calculator","income-tax-calculator","gst-calculator","sip-calculator","lumpsum-calculator","emi-calculator","fd-calculator","compound-interest-calculator","percentage-calculator"]);
export function CurrencyFormatSelector() {
  const pathname = usePathname();
  const {currency} = useCurrencyFormat();
  if (!paths.has(pathname.split("/").filter(Boolean)[0])) return null;
  const indiaOnly = /income-tax|in-hand-salary|gst-calculator/.test(pathname);
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
    <label htmlFor="currency-format" className="text-xs font-semibold text-slate-600">Currency format</label>
    <select id="currency-format" value={currency} onChange={e=>{
      fallback=validCurrency(e.target.value);
      try {localStorage.setItem(key,fallback);} catch {}
      listeners.forEach(listener=>listener());
    }} className="text-sm rounded-md border border-slate-300 bg-white px-3 py-2 max-w-full">
      {Object.entries(currencyFormats).map(([code,item])=><option key={code} value={code}>{item.label}</option>)}
    </select>
    <span className="text-xs text-slate-500">{indiaOnly?"Indian tax and salary amounts stay in INR; number grouping follows your selection.":"Display format only; amounts are not exchange-rate converted. PPF remains in INR."}</span>
  </div>;
}
