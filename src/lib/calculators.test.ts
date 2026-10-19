import { describe, expect, it } from "vitest";
import { calculateAge, localDateValue } from "./age-calculator";
import { boundedYears, calculatorError, loanRepayment, recurringFutureValue } from "./calculator-math";

describe("Age Calculator", () => {
  it("handles exact birthdays without adding an extra year", () => {
    expect(calculateAge("2000-10-19", "2026-10-19")).toMatchObject({ years: 26, months: 0, days: 0, daysUntilNextBday: 0, nextBdayAge: 26 });
  });
  it("handles month ends without negative days", () => {
    expect(calculateAge("2000-01-31", "2000-03-01")).toMatchObject({ years: 0, months: 1, days: 1, totalDays: 30 });
    expect(calculateAge("2025-01-31", "2025-03-01")).toMatchObject({ months: 1, days: 1, totalDays: 29 });
  });
  it("uses February 28 for a leap-day birthday in a non-leap year", () => {
    expect(calculateAge("2000-02-29", "2025-02-28")).toMatchObject({ years: 25, months: 0, days: 0, daysUntilNextBday: 0, nextBdayAge: 25 });
  });
  it("counts calendar days across daylight saving boundaries", () => {
    expect(calculateAge("2026-03-07", "2026-03-09")?.totalDays).toBe(2);
  });
  it("rejects empty, impossible and reversed dates", () => {
    expect(calculateAge("", "2026-10-19")).toBeNull();
    expect(calculateAge("2026-02-30", "2026-10-19")).toBeNull();
    expect(calculateAge("2027-01-01", "2026-10-19")).toBeNull();
  });
  it("formats local calendar dates rather than UTC", () => {
    expect(localDateValue(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
  });
});
describe("Investment and loan calculator regressions", () => {
  it("returns principal and a monthly payment for zero-interest loans", () => {
    expect(loanRepayment(120000, 0, 12)).toEqual({ monthly: 10000, total: 120000, interest: 0 });
  });
  it("matches a standard EMI reference calculation", () => {
    expect(loanRepayment(1000000, 9.5, 180).monthly).toBeCloseTo(10442.2466, 3);
  });
  it("keeps zero-return SIP schedule totals equal to contributions", () => {
    expect(recurringFutureValue(25000, 0, 12)).toBe(300000);
    expect(recurringFutureValue(25000, 0, 120)).toBe(3000000);
  });
  it("matches beginning-of-month SIP compounding", () => {
    expect(recurringFutureValue(25000, 12, 120)).toBeCloseTo(5808476.9088, 2);
    expect(recurringFutureValue(100, 1e-10, 12)).toBeCloseTo(1200, 5);
  });
  it("bounds loops and rejects unsupported numeric inputs", () => {
    expect(boundedYears(Infinity)).toBe(0); expect(boundedYears(1e9)).toBe(50);
    expect(calculatorError([{ label: "Tenure", value: 0, min: 1, max: 30, whole: true }])).toContain("Tenure");
    expect(calculatorError([{ label: "Tenure", value: 1.5, min: 1, max: 30, whole: true }])).toContain("whole number");
    expect(calculatorError([{ label: "Rate", value: 0, min: 0, max: 30 }])).toBe("");
  });
});
