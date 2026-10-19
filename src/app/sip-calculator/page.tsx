import type { Metadata } from "next";
import { Suspense } from "react";
import { SipCalculatorTool } from "@/components/tools/SipCalculatorTool";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("sip-calculator");

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
        SIP Calculator
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-2xl">
        Calculate returns on your monthly Systematic Investment Plan (SIP) and mutual fund investments with compounding insights.
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />}>
          <SipCalculatorTool defaultType="sip" />
        </Suspense>
      </div>
    </div>
  );
}

