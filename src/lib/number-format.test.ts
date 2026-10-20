import { describe, expect, it } from "vitest";
import { formatMoney, groupNumber, validCurrency } from "./number-format";
import { numberWords } from "./number-words";
describe("Shared currency formatting",()=>{
  it("defaults to Indian grouping",()=>{
    expect(groupNumber("1250000")).toBe("12,50,000");
    expect(formatMoney(1250000)).toBe("₹12,50,000");
    expect(validCurrency("invalid")).toBe("INR");
    expect(validCurrency("toString")).toBe("INR");
    expect(validCurrency(null)).toBe("INR");
  });
  it("formats other currencies without converting the number",()=>{
    expect(groupNumber("1250000","USD")).toBe("1,250,000");
    expect(formatMoney(1250000,"USD")).toBe("$1,250,000");
    expect(formatMoney(1250000,"GBP")).toBe("£1,250,000");
    expect(formatMoney(1250000,"EUR")).toContain("1,250,000");
    expect(formatMoney(1250000,"AED")).toContain("1,250,000");
    expect(formatMoney(1250000,"USD",0,true)).toContain("1,250,000");
    expect(formatMoney(1250000,"USD",0,true)).not.toContain("$");
  });
  it("keeps decimal drafts, negatives, zero and trailing decimal",()=>{
    expect(groupNumber("1250000.05")).toBe("12,50,000.05");
    expect(groupNumber("-1250000.05","USD")).toBe("-1,250,000.05");
    expect(groupNumber("00012.")).toBe("12.");
    expect(groupNumber("")).toBe("");
    expect(groupNumber("-")).toBe("-");
    expect(formatMoney(NaN)).toBe("—");
  });
  it("uses the selected currency in words",()=>{
    expect(numberWords("1250000.50","international",true,false,"USD").words).toContain("US dollars and fifty cents");
    expect(numberWords("1.01","international",true,true,"GBP").words).toBe("One pound and one penny only");
    expect(numberWords("2.02","international",true,false,"AED").words).toBe("Two dirhams and two fils");
  });
});
