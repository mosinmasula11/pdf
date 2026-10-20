import { describe, expect, it } from "vitest";
import { numberWords } from "./number-words";
import { salaryEstimate, type SalaryInputs } from "./salary-estimate";
describe("Number to words", () => {
  it("supports Indian, international, decimal and cheque formats", () => {
    expect(numberWords("1250000", "indian", true, false).words).toBe("Twelve lakh fifty thousand rupees");
    expect(numberWords("1250000", "international", false, false).words).toBe("One million two hundred fifty thousand");
    expect(numberWords("-12.05", "indian", false, false).words).toBe("Minus twelve point zero five");
    expect(numberWords("1.01", "indian", true, true).words).toBe("One rupee and one paisa only");
    expect(numberWords("0", "international", false, false).words).toBe("Zero");
    expect(numberWords("", "indian", false, false).words).toBe("");
  });
  it("rejects invalid and excessively large values", () => {
    for (const value of ["1e5", "abc", "1000000000000", "1.001"]) expect(() => numberWords(value, "indian", false, false)).toThrow();
    expect(() => numberWords("-1", "indian", true, false)).toThrow();
  });
});
describe("Salary estimates", () => {
  const base: SalaryInputs = { ctc: 1200000, employerCosts: 60000, bonus: 60000, monthlyPf: 1800, monthlyProfessionalTax: 200, monthlyOther: 0, regime: "new", oldDeductions: 0 };
  it("separates bonus, employer costs and employee deductions", () => {
    const result = salaryEstimate(base);
    expect(result.tax).toBe(0);
    expect(result.regularNet).toBe(88000);
    expect(result.annualNet).toBe(1116000);
    expect(result.averageMonthly).toBe(93000);
  });
  it("applies new tax, and old deductions without double counting", () => {
    expect(salaryEstimate({ ...base, ctc: 2000000 }).tax).toBeGreaterThan(0);
    const result = salaryEstimate({ ...base, regime: "old", oldDeductions: 150000 });
    expect(result.taxable).toBe(937600);
  });
  it("accepts zero and rejects unsupported payroll", () => {
    expect(salaryEstimate({ ...base, ctc: 0, employerCosts: 0, bonus: 0, monthlyPf: 0, monthlyProfessionalTax: 0 }).annualNet).toBe(0);
    for (const change of [{ctc: 5000001}, {bonus: 1200000}, {monthlyPf: -1}, {monthlyOther: 100000}, {monthlyProfessionalTax: 300}, {ctc: NaN}]) expect(() => salaryEstimate({...base, ...change})).toThrow();
  });
});
