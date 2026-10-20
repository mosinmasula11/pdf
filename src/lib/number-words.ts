import { formatIndianAmount, indianAmountWords } from "./indian-amount";
import type { CurrencyFormat } from "./number-format";

const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function international(n: number): string {
  if (n < 20) return small[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + international(n % 10) : "");
  for (const [size, name] of [[1e9, "billion"], [1e6, "million"], [1000, "thousand"], [100, "hundred"]] as const) {
    if (n >= size) return international(Math.floor(n / size)) + " " + name + (n % size ? " " + international(n % size) : "");
  }
  return "";
}
export function numberWords(raw: string, system: "indian" | "international", currency: boolean, cheque: boolean, code: CurrencyFormat = "INR") {
  const clean = raw.replace(/[,₹\s]/g, "");
  if (!clean) return { formatted: "", words: "" };
  if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(clean)) throw new Error("Enter up to 12 digits and 2 decimal places.");
  if (currency && clean.startsWith("-")) throw new Error("Currency amounts must be non-negative.");
  const negative = clean.startsWith("-");
  const unsigned = clean.replace(/^-/, "");
  const [whole, fraction] = unsigned.split(".");
  const formatted = system === "indian" ? formatIndianAmount(unsigned)! : Number(whole).toLocaleString("en-US") + (fraction ? "." + fraction : "");
  const indian = indianAmountWords(formatIndianAmount(whole)!).replace(/ rupees?$/, "").toLowerCase();
  let result = system === "indian" ? indian : international(Number(whole));
  if (currency) {
    const paise = Number((fraction || "").padEnd(2, "0"));
    const units = {INR:["rupee","rupees","paisa","paise"],USD:["US dollar","US dollars","cent","cents"],EUR:["euro","euros","cent","cents"],GBP:["pound","pounds","penny","pence"],AED:["dirham","dirhams","fil","fils"]}[code];
    result += " " + units[Number(whole) === 1 ? 0 : 1];
    if (paise) result += " and " + international(paise) + " " + units[paise === 1 ? 2 : 3];
    if (cheque) result += " only";
  } else if (fraction) result += " point " + fraction.split("").map(d => small[Number(d)]).join(" ");
  if (negative && Number(clean) !== 0) result = "minus " + result;
  return { formatted: (negative ? "-" : "") + formatted, words: result[0].toUpperCase() + result.slice(1) };
}
