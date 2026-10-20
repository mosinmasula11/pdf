"use client";

import { useState } from "react";
import { Wallet, Download } from "lucide-react";
import { salaryEstimate } from "@/lib/salary-estimate";
import { formatIndianAmount, indianAmountWords } from "@/lib/indian-amount";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { useCurrencyFormat } from "./CurrencyFormat";

const fields = [
  ["ctc", "Annual CTC", "Total annual cost to company, including employer benefits.", "12,00,000"],
  ["employerCosts", "Annual employer-only costs", "Employer PF, gratuity provision, insurance and other non-cash CTC costs. Do not include employee deductions.", "60,000"],
  ["bonus", "Annual variable pay / bonus", "Included in CTC. Assumed paid separately, not in regular monthly salary.", "60,000"],
  ["monthlyPf", "Monthly employee PF", "Employee contribution deducted from pay. Enter the actual amount from your salary structure.", "1,800"],
  ["monthlyProfessionalTax", "Monthly professional tax (average)", "State-specific; enter 0 if not applicable. Annual maximum Rs 2,500.", "200"],
  ["monthlyOther", "Other monthly deductions", "Employee insurance, recoveries or other payroll deductions; excludes PF, professional tax and TDS.", "0"],
  ["oldDeductions", "Annual eligible old-regime deductions", "Total eligible exemptions and deductions, including eligible employee PF / 80C and HRA. Exclude standard deduction and professional tax; these are calculated separately.", "1,50,000"],
] as const;
type Field = typeof fields[number][0];
export function InHandSalaryTool() {
  const {money}=useCurrencyFormat(true);
  const [values, setValues] = useState<Record<Field, string>>({ctc:"12,00,000",employerCosts:"60,000",bonus:"60,000",monthlyPf:"1,800",monthlyProfessionalTax:"200",monthlyOther:"0",oldDeductions:"1,50,000"});
  const [regime, setRegime] = useState<"new" | "old">("new");
  let result: ReturnType<typeof salaryEstimate> | null = null, error = "";
  const numeric = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === "" || value.endsWith(".") ? NaN : Number(value.replace(/,/g,""))])) as Record<Field, number>;
  try { result = salaryEstimate({...numeric, oldDeductions: regime === "old" ? numeric.oldDeductions : 0, regime}); } catch (e) {error = (e as Error).message;}
  const rows = result ? [
    ["Annual CTC", numeric.ctc], ["Employer-only costs", numeric.employerCosts], ["Annual gross cash salary (including bonus)", result.gross],
    ["Annual bonus (included above)", numeric.bonus], ["Regular monthly gross", result.regularGross], ["Monthly employee PF", numeric.monthlyPf],
    ["Monthly professional tax", numeric.monthlyProfessionalTax], ["Other monthly deductions", numeric.monthlyOther], ["Estimated monthly TDS", result.monthlyTax],
    ["Regular monthly take-home", result.regularNet], ["Average monthly take-home (including bonus)", result.averageMonthly], ["Annual take-home (including bonus)", result.annualNet],
    ["Annual taxable salary", result.taxable], ["Annual estimated income tax (including cess)", result.tax],
  ] as const : [];
  function download() {
    const content = "FY 2025-26 (AY 2026-27),"+regime+" regime\nItem,INR\n"+rows.map(([name,value]) => '"'+name+'",'+value.toFixed(2)).join("\n");
    const url = URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");link.href=url;link.download="salary-estimate.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <main className="calculator-workspace max-w-6xl mx-auto px-4 sm:px-6 py-8">
    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3"><Wallet className="text-violet-600 shrink-0"/>In-hand Salary Calculator</h1>
    <p className="text-sm text-slate-600 mt-2">CTC to take-home estimate for FY 2025–26 / AY 2026–27. Resident salaried individuals under 60; CTC up to ₹50 lakh.</p>
    <div className="grid lg:grid-cols-2 gap-8 mt-7">
      <section>
        <fieldset className="mb-6"><legend className="text-sm font-semibold mb-2">Tax regime</legend><div className="flex gap-5">{(["new","old"] as const).map(item=><label key={item} className="flex items-center gap-2 text-sm"><input type="radio" name="salary-regime" checked={regime===item} onChange={()=>setRegime(item)} className="accent-violet-600"/>{item==="new"?"New regime":"Old regime"}</label>)}</div></fieldset>
        <div className="grid sm:grid-cols-2 gap-5">{fields.filter(([key])=>key!=="oldDeductions"||regime==="old").map(([key,label,hint,placeholder])=><div key={key} className={key==="oldDeductions"?"sm:col-span-2":""}>
          <label htmlFor={"salary-"+key} className="text-sm font-semibold block mb-1.5">{label} (₹)</label>
          <FormattedNumberInput id={"salary-"+key} type="text" inputMode="decimal" value={values[key]} placeholder={placeholder} aria-describedby={"salary-"+key+"-hint"} onChange={e=>{const formatted=formatIndianAmount(e.target.value);if(formatted!==null)setValues(previous=>({...previous,[key]:formatted}));}} className="w-full border border-slate-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
          {key==="ctc"&&<p className="text-xs text-violet-700 mt-1.5">{indianAmountWords(values[key])}</p>}
          <p id={"salary-"+key+"-hint"} className="text-xs leading-5 text-slate-500 mt-1.5">{hint}</p>
        </div>)}</div>
      </section>
      <section className="min-w-0 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-7">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Your salary breakdown</h2>
        {error ? <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 p-4 rounded-md">{error}</p> : result && <>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-md mb-5"><p className="text-sm text-emerald-900">Regular monthly take-home</p><p className="text-3xl font-bold text-emerald-950 mt-2 break-words">{money(result.regularNet)}</p><p className="text-xs text-emerald-800 mt-2">Excludes separately paid bonus; includes average monthly TDS.</p></div>
          <dl className="divide-y divide-slate-100">{rows.map(([name,value])=><div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5 text-sm"><dt className="text-slate-600">{name}</dt><dd className="font-semibold text-slate-900 text-right">{money(value)}</dd></div>)}</dl>
          <button type="button" onClick={download} className="mt-4 inline-flex gap-2 items-center text-sm border border-slate-300 rounded-md px-3 py-2"><Download size={16}/>Download breakdown</button>
        </>}
      </section>
    </div>
    <section className="border-t border-slate-200 mt-9 pt-6 text-sm text-slate-600 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Assumptions and common questions</h2>
      <p>Planning estimate, not a payslip or tax return. This tool uses FY 2025–26 rules only, not current-year payroll advice. Bonus is assumed earned in full. TDS is spread evenly across 12 months; actual payroll timing and rounding differ.</p>
      <details><summary className="font-medium text-slate-800 cursor-pointer">Which PF amount should I enter?</summary><p className="mt-2">Use your employer’s actual employee contribution. Many covered employees contribute 12% of eligible PF wages, with a ₹15,000 wage ceiling in applicable cases; higher-wage arrangements and exceptions exist. Employer PF belongs under employer-only costs, not employee PF.</p></details>
      <details><summary className="font-medium text-slate-800 cursor-pointer">What is included in the tax estimate?</summary><p className="mt-2">Standard deduction, applicable resident rebate, new-regime marginal relief and 4% cess. Old-regime professional tax is deducted automatically. Include eligible employee PF in your old-regime deduction total only once, within applicable statutory caps. Deductions must be verified by you.</p></details>
      <p>Other income, capital gains, surcharge, employer NPS tax deductions, ESI and taxable perquisites are not modeled automatically. Add actual employee ESI to other payroll deductions where applicable. Do not use this tool for unsupported or complex tax situations.</p>
      <p>Sources: <a className="text-violet-700 underline" href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noreferrer">Income Tax Department</a> · <a className="text-violet-700 underline" href="https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/ContributionRate.pdf" target="_blank" rel="noreferrer">EPFO contribution guidance</a>. Your entries stay in your browser.</p>
    </section>
  </main>;
}
