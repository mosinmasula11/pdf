import type { Metadata } from "next";
import { Suspense } from "react";
import { IncomeTaxCalculatorTool } from "@/components/tools/IncomeTaxCalculatorTool";

export const metadata: Metadata = {
  title: "Income Tax Calculator FY 2024-25 & FY 2025-26 - New vs Old Regime Tax Comparison",
  description:
    "Free online Income Tax Calculator for FY 2024-25 & 2025-26 (AY 2025-26). Compare New vs Old Tax Regime tax liability side-by-side with 80C, 80D, HRA deductions, and 87A rebate.",
  alternates: {
    canonical: "/income-tax-calculator",
  },
  keywords: [
    "income tax calculator",
    "income tax calculator fy 2024-25",
    "new tax regime vs old tax regime",
    "budget 2024 tax calculator",
    "tax rebate 87a calculator",
    "salary tax calculator india",
    "80c deduction calculator",
  ],
};

export default function IncomeTaxCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading Income Tax Calculator...</div>}>
      <IncomeTaxCalculatorTool />
    </Suspense>
  );
}

