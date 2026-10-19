import type { Metadata } from "next";
import { Suspense } from "react";
import { DateCalculatorTool } from "@/components/tools/DateCalculatorTool";

export const metadata: Metadata = {
  title: "Date & Day Difference Calculator - Business Days & Add/Subtract Days",
  description:
    "Free online Date Difference Calculator. Calculate exact days, business days, and weekends between two dates, or add/subtract days from any date.",
  alternates: {
    canonical: "/date-calculator",
  },
  keywords: [
    "date calculator",
    "days between dates",
    "business days calculator",
    "work days calculator",
    "add days to date",
    "subtract days from date",
    "day difference calculator",
  ],
};

export default function DateCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading Date Calculator...</div>}>
      <DateCalculatorTool />
    </Suspense>
  );
}

