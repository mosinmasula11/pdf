import type { Metadata } from "next";
import { Suspense } from "react";
import { PercentageCalculatorTool } from "@/components/tools/PercentageCalculatorTool";

export const metadata: Metadata = {
  title: "Percentage Calculator - Find Percentages, % Difference & Discounts",
  description:
    "Free online Percentage Calculator. Calculate percentage of a number, percentage increase/decrease, ratio fractions, and sale price discounts instantly.",
  alternates: {
    canonical: "/percentage-calculator",
  },
  keywords: [
    "percentage calculator",
    "percentage calculator online",
    "calculate percentage",
    "percentage increase calculator",
    "discount calculator",
    "what is x percent of y",
  ],
};

export default function PercentageCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading Percentage Calculator...</div>}>
      <PercentageCalculatorTool />
    </Suspense>
  );
}

