export const currencyFormats = {
  INR: { label: "INR — Indian rupee", locale: "en-IN", symbol: "₹" },
  USD: { label: "USD — US dollar", locale: "en-US", symbol: "$" },
  EUR: { label: "EUR — Euro", locale: "en-IE", symbol: "€" },
  GBP: { label: "GBP — British pound", locale: "en-GB", symbol: "£" },
  AED: { label: "AED — UAE dirham", locale: "en-AE", symbol: "AED" },
} as const;
export type CurrencyFormat = keyof typeof currencyFormats;
export function validCurrency(value: string | null): CurrencyFormat {
  return value && Object.hasOwn(currencyFormats, value) ? value as CurrencyFormat : "INR";
}
export function formatMoney(value: number, currency: CurrencyFormat = "INR", decimals = 0, fixedINR = false) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(currencyFormats[currency].locale, {style:"currency",currency:fixedINR?"INR":currency,minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);
}
export function groupNumber(raw: string, currency: CurrencyFormat = "INR") {
  if (!raw || raw === "-") return raw;
  const negative = raw.startsWith("-");
  const [whole, fraction] = raw.replace(/^-/, "").split(".");
  const digits = (whole || "0").replace(/^0+(?=\d)/, "");
  const grouped = currency === "INR"
    ? digits.length > 3 ? digits.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,",")+","+digits.slice(-3) : digits
    : digits.replace(/\B(?=(\d{3})+(?!\d))/g,",");
  return (negative?"-":"")+grouped+(fraction===undefined?"":"."+fraction);
}
