import { describe, expect, it } from "vitest";
import { formatIndianAmount, indianAmountWords } from "./indian-amount";
describe("Indian income amounts", () => {
  it("groups lakh and crore amounts and accepts pasted currency", () => {
    expect(formatIndianAmount("1250000")).toBe("12,50,000");
    expect(formatIndianAmount("₹ 1,23,45,678.50")).toBe("1,23,45,678.50");
    expect(formatIndianAmount("00050")).toBe("50");
  });
  it("preserves empty and decimal editing states", () => {
    expect(formatIndianAmount("")).toBe("");
    expect(formatIndianAmount("12.")).toBe("12.");
    expect(formatIndianAmount(".5")).toBe("0.5");
    expect(formatIndianAmount("-12")).toBeNull();
    expect(formatIndianAmount("12x")).toBeNull();
    expect(formatIndianAmount("1.234")).toBeNull();
  });
  it("converts rupees and paise to Indian words", () => {
    expect(indianAmountWords("12,50,000")).toBe("Twelve lakh fifty thousand rupees");
    expect(indianAmountWords("1,00,00,000")).toBe("One crore rupees");
    expect(indianAmountWords("50,000.50")).toBe("Fifty thousand rupees and fifty paise");
    expect(indianAmountWords("1.01")).toBe("One rupee and one paisa");
    expect(indianAmountWords("0")).toBe("Zero rupees");
    expect(indianAmountWords("")).toBe("");
  });
});
