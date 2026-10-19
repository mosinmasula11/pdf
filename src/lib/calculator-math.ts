export function recurringFutureValue(payment: number, annualRate: number, months: number) {
  if (!Number.isFinite(months) || months <= 0) return 0;
  const rate = annualRate / 1200;
  return rate === 0 ? payment * months : payment * (Math.expm1(months * Math.log1p(rate)) / rate) * (1 + rate);
}
export function loanRepayment(principal: number, annualRate: number, months: number) {
  const monthly = months > 0 ? annualRate === 0 ? principal / months : principal * (annualRate / 1200) / -Math.expm1(-months * Math.log1p(annualRate / 1200)) : 0;
  const total = monthly * months;
  return { monthly, total, interest: Math.max(0, total - principal) };
}
export type CalculatorRule = { label: string; value: number; min: number; max: number; whole?: boolean };
export function calculatorError(rules: CalculatorRule[]) {
  const invalid = rules.find(rule => !Number.isFinite(rule.value) || rule.value < rule.min || rule.value > rule.max || (rule.whole && !Number.isInteger(rule.value)));
  return invalid ? invalid.label + " must be " + (invalid.whole ? "a whole number " : "") + "between " + invalid.min.toLocaleString("en-IN") + " and " + invalid.max.toLocaleString("en-IN") + "." : "";
}
export function boundedYears(years: number) { return Number.isFinite(years) ? Math.min(50, Math.max(0, Math.floor(years))) : 0; }
