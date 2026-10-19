import type { Metadata } from "next";
import { Suspense } from "react";
import { UnitConverterTool } from "@/components/tools/UnitConverterTool";

export const metadata: Metadata = {
  title: "Unit Converter Online - Length, Weight, Area, Data Storage & Temp",
  description:
    "Free online Unit Converter. Convert length (meters, miles, feet), weight (kg, lbs), land area (acres, bigha, sq ft), digital storage (GB, MB), and temperature instantly.",
  alternates: {
    canonical: "/unit-converter",
  },
  keywords: [
    "unit converter",
    "unit converter online",
    "area converter",
    "sq ft to sq meter",
    "kg to lbs converter",
    "acres to bigha",
    "length converter",
  ],
};

export default function UnitConverterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading Unit Converter...</div>}>
      <UnitConverterTool />
    </Suspense>
  );
}

