import { residentTax } from "./income-tax";

export type SalaryInputs = { ctc: number; employerCosts: number; bonus: number; monthlyPf: number; monthlyProfessionalTax: number; monthlyOther: number; regime: "old" | "new"; oldDeductions: number };
export function salaryEstimate(input: SalaryInputs) {
  const { ctc, employerCosts, bonus, monthlyPf, monthlyProfessionalTax, monthlyOther, regime, oldDeductions } = input;
  if ([ctc, employerCosts, bonus, monthlyPf, monthlyProfessionalTax, monthlyOther, oldDeductions].some(n => !Number.isFinite(n) || n < 0)) throw new Error("Enter a valid, non-negative amount in every field.");
  if (ctc > 5000000) throw new Error("This estimate supports CTC up to Rs 50 lakh. Higher incomes need surcharge calculations.");
  if (employerCosts + bonus > ctc) throw new Error("Employer costs and bonus cannot exceed annual CTC.");
  if (monthlyProfessionalTax > 2500 / 12) throw new Error("Professional tax cannot exceed Rs 2,500 per year. Enter its monthly average.");
  const gross = ctc - employerCosts;
  const regularGross = (gross - bonus) / 12;
  if (monthlyPf + monthlyProfessionalTax + monthlyOther > regularGross) throw new Error("Monthly payroll deductions cannot exceed regular monthly gross salary.");
  const standardDeduction = Math.min(gross, regime === "new" ? 75000 : 50000);
  const taxable = Math.max(0, gross - standardDeduction - (regime === "old" ? oldDeductions + monthlyProfessionalTax * 12 : 0));
  if (regime === "old" && oldDeductions > gross - standardDeduction) throw new Error("Eligible old-regime deductions cannot exceed salary after the standard deduction.");
  const tax = residentTax(taxable, regime, "FY2025-26", "below60").totalTax;
  const monthlyTax = tax / 12;
  const regularNet = regularGross - monthlyPf - monthlyProfessionalTax - monthlyOther - monthlyTax;
  if (regularNet < 0) throw new Error("Deductions and estimated tax exceed regular pay. Check bonus and deductions.");
  const annualNet = gross - (monthlyPf + monthlyProfessionalTax + monthlyOther) * 12 - tax;
  return { gross, regularGross, standardDeduction, taxable, tax, monthlyTax, regularNet, annualNet, averageMonthly: annualNet / 12 };
}
