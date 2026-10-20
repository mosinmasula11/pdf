export function formatIndianAmount(raw: string): string | null {
  const value = raw.replace(/[,₹\s]/g, "");
  if (!/^\d{0,12}(\.\d{0,2})?$/.test(value)) return null;
  if (!value) return "";
  const [whole, decimal] = value.split(".");
  const digits = (whole || "0").replace(/^0+(?=\d)/, "");
  const grouped = digits.length > 3
    ? digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + digits.slice(-3)
    : digits;
  return grouped + (decimal === undefined ? "" : "." + decimal);
}

const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function words(n: number): string {
  if (n < 20) return small[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + words(n % 10) : "");
  for (const [size, name] of [[10000000, "crore"], [100000, "lakh"], [1000, "thousand"], [100, "hundred"]] as const) {
    if (n >= size) return words(Math.floor(n / size)) + " " + name + (n % size ? " " + words(n % size) : "");
  }
  return "";
}
export function indianAmountWords(formatted: string): string {
  if (!formatted) return "";
  const [whole, fraction = ""] = formatted.replace(/,/g, "").split(".");
  const rupees = Number(whole);
  const paise = Number(fraction.padEnd(2, "0"));
  const result = words(rupees) + (rupees === 1 ? " rupee" : " rupees") + (paise ? " and " + words(paise) + (paise === 1 ? " paisa" : " paise") : "");
  return result[0].toUpperCase() + result.slice(1);
}
