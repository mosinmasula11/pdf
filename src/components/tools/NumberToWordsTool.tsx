"use client";

import { useState } from "react";
import { Copy, Download, Hash, Check } from "lucide-react";
import { numberWords } from "@/lib/number-words";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

export function NumberToWordsTool() {
  const [value, setValue] = useState("1250000");
  const {currency: code}=useCurrencyFormat();
  const [selectedSystem, setSystem] = useState<"indian" | "international" | null>(null);
  const system=selectedSystem??(code==="INR"?"indian":"international");
  const [currency, setCurrency] = useState(true);
  const [cheque, setCheque] = useState(false);
  const [message, setMessage] = useState("");
  let result = { formatted: "", words: "" }, error = "";
  try { result = numberWords(value, system, currency, cheque, code); } catch (e) { error = (e as Error).message; }
  async function copy() {
    try { await navigator.clipboard.writeText(result.words); setMessage("Copied"); }
    catch { setMessage("Copy unavailable. Select and copy the result below."); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([result.formatted + "\n" + result.words + "\n"], {type: "text/plain;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url; link.download = "number-in-words.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="calculator-workspace max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3"><Hash className="text-violet-600 shrink-0" />Number to Words</h1>
    <p className="text-sm text-slate-600 mt-2 mb-8">Convert numbers into English words, currency amounts or cheque wording.</p>
    <div className="grid md:grid-cols-2 gap-8">
      <section className="space-y-5">
        <div><label htmlFor="words-number" className="block font-semibold text-sm mb-2">Number or amount</label>
          <FormattedNumberInput id="words-number" type="text" inputMode="decimal" value={value} onChange={e => {setValue(e.target.value); setMessage("");}} placeholder="e.g. 12,50,000.50" aria-invalid={!!error} aria-describedby="words-hint words-error"
            className="w-full border border-slate-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <p id="words-hint" className="text-xs text-slate-500 mt-2">Up to 12 digits and 2 decimal places. Commas are optional.</p>
          <p id="words-error" role={error ? "alert" : undefined} className="text-sm text-red-700 mt-2">{error}</p>
        </div>
        <fieldset><legend className="text-sm font-semibold mb-2">Number system</legend>
          <div className="flex flex-wrap gap-4">{(["indian", "international"] as const).map(item => <label key={item} className="flex gap-2 items-center text-sm"><input type="radio" name="number-system" checked={system === item} onChange={() => {setSystem(item);setMessage("");}} className="accent-violet-600" />{item === "indian" ? "Indian (lakh, crore)" : "International (million, billion)"}</label>)}</div>
        </fieldset>
        <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={currency} onChange={e => {setCurrency(e.target.checked);setMessage("");}} className="accent-violet-600" />{code==="INR"?"Rupees and paise":code+" currency wording"}</label>
        <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={cheque} disabled={!currency} onChange={e => {setCheque(e.target.checked);setMessage("");}} className="accent-violet-600" />Cheque wording (ends with “only”)</label>
      </section>
      <section className="border-l-2 border-violet-200 pl-5 min-w-0">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">In words</h2>
        <p className="text-sm text-violet-700 font-semibold break-words">{error ? "" : result.formatted}</p>
        <p className="text-xl leading-8 font-semibold text-slate-900 mt-3 break-words min-h-24">{error ? "Check the number to continue." : result.words || "Enter a number."}</p>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={copy} disabled={!!error || !result.words} className="inline-flex items-center gap-2 rounded-md bg-violet-600 text-white px-4 py-2 text-sm disabled:opacity-40">{message === "Copied" ? <Check size={16}/> : <Copy size={16}/>}Copy</button>
          <button type="button" onClick={download} disabled={!!error || !result.words} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"><Download size={16}/>Download</button>
        </div>
        <p role="status" className="text-sm text-slate-600 mt-3">{message}</p>
      </section>
    </div>
    <section className="border-t border-slate-200 mt-10 pt-6 space-y-4 text-sm text-slate-600">
      <h2 className="text-lg font-semibold text-slate-900">Common questions</h2>
      <details><summary className="cursor-pointer font-medium text-slate-800">How are decimal numbers converted?</summary><p className="mt-2">Currency mode converts two decimal places into paise, cents, pence or fils for the selected currency. Number mode reads each decimal digit, such as “one point zero five”.</p></details>
      <details><summary className="cursor-pointer font-medium text-slate-800">Can I convert negative numbers?</summary><p className="mt-2">Yes, in number mode. Currency and cheque amounts must be non-negative. Confirm cheque wording with your bank before use.</p></details>
      <p>Your number is processed in your browser and is not uploaded.</p>
    </section>
  </main>;
}
