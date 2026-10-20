import type { Metadata } from "next";
import { NumberToWordsTool } from "@/components/tools/NumberToWordsTool";
export const metadata: Metadata = {
  title: "Number to Words Converter - Indian Rupees & International Numbers",
  description: "Convert numbers to English words using lakh, crore, million or billion. Copy rupees and paise or download cheque wording.",
  alternates: { canonical: "/number-to-words" },
};
export default function Page() { return <NumberToWordsTool />; }
