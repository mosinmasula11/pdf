import type { Metadata } from "next";
import { Suspense } from "react";
import { AgeCalculatorTool } from "@/components/tools/AgeCalculatorTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("age-calculator");

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">
        Online Age Calculator
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        Calculate your exact age in years, months, and days, count down to your next birthday, and explore fun biological milestones and zodiac insights.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />}>
          <AgeCalculatorTool />
        </Suspense>
      </div>
    </div>
  );
}

