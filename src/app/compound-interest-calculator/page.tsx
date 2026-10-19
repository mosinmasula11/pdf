import type { Metadata } from "next";
import { Suspense } from "react";
import { CompoundInterestCalculatorTool } from "@/components/tools/CompoundInterestCalculatorTool";

export const metadata: Metadata = {
  title: "Compound Interest Calculator Online - Daily, Monthly & Yearly Compounding",
  description:
    "Free Compound Interest Calculator with monthly deposits, annual return rates, compounding frequencies (daily, monthly, quarterly, annual), and year-by-year schedule.",
  alternates: {
    canonical: "/compound-interest-calculator",
  },
  keywords: [
    "compound interest calculator",
    "compound interest calculator online",
    "compound interest with monthly contributions",
    "wealth growth calculator",
    "interest compounding formula",
  ],
};

export default function CompoundInterestCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading Compound Interest Calculator...</div>}>
      <CompoundInterestCalculatorTool />
    </Suspense>
  );
}

