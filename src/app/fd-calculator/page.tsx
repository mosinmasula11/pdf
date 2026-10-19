import type { Metadata } from "next";
import { Suspense } from "react";
import { FdCalculatorTool } from "@/components/tools/FdCalculatorTool";

export const metadata: Metadata = {
  title: "FD Calculator Online - Fixed Deposit, RD & PPF Interest Calculator",
  description:
    "Free online Fixed Deposit (FD) and Recurring Deposit (RD) calculator with quarterly compounding, senior citizen interest bonus, and maturity amount breakdown.",
  alternates: {
    canonical: "/fd-calculator",
  },
  keywords: [
    "fd calculator",
    "fixed deposit calculator",
    "rd calculator",
    "ppf calculator",
    "bank fd interest calculator",
    "post office fd calculator",
  ],
};

export default function FdCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading FD Calculator...</div>}>
      <FdCalculatorTool />
    </Suspense>
  );
}

