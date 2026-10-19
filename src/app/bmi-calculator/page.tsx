import type { Metadata } from "next";
import { Suspense } from "react";
import { BmiCalculatorTool } from "@/components/tools/BmiCalculatorTool";

export const metadata: Metadata = {
  title: "BMI & Calorie Calculator - Body Mass Index, BMR & TDEE Target",
  description:
    "Free online BMI Calculator. Calculate Body Mass Index, ideal weight range, Basal Metabolic Rate (BMR), and daily maintenance calories (TDEE) with Metric & Imperial units.",
  alternates: {
    canonical: "/bmi-calculator",
  },
  keywords: [
    "bmi calculator",
    "body mass index calculator",
    "bmi calculator online",
    "calorie calculator",
    "bmr calculator",
    "tdee calculator",
    "ideal body weight calculator",
  ],
};

export default function BmiCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading BMI Calculator...</div>}>
      <BmiCalculatorTool />
    </Suspense>
  );
}

