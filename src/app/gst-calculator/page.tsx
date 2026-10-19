import type { Metadata } from "next";
import { Suspense } from "react";
import { GstCalculatorTool } from "@/components/tools/GstCalculatorTool";

export const metadata: Metadata = {
  title: "GST Calculator Online - Inclusive & Exclusive GST (5%, 12%, 18%, 28%)",
  description:
    "Free online GST Calculator for India. Calculate GST inclusive & exclusive amounts, CGST, SGST, IGST split, and invoice totals instantly.",
  alternates: {
    canonical: "/gst-calculator",
  },
  keywords: [
    "gst calculator",
    "gst calculator online",
    "gst inclusive calculator",
    "gst exclusive calculator",
    "cgst sgst calculator",
    "18 gst calculator",
    "reverse gst calculator",
  ],
};

export default function GstCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 text-center text-slate-500">Loading GST Calculator...</div>}>
      <GstCalculatorTool />
    </Suspense>
  );
}

