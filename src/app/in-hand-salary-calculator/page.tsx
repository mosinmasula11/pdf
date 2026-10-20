import type { Metadata } from "next";
import { InHandSalaryTool } from "@/components/tools/InHandSalaryTool";
export const metadata: Metadata = {
  title: "In-hand Salary Calculator - CTC to Take-home Pay India",
  description: "Estimate monthly take-home from annual CTC for FY 2025-26. Review employer costs, PF, bonus, payroll deductions and old or new regime tax.",
  alternates: { canonical: "/in-hand-salary-calculator" },
};
export default function Page() { return <InHandSalaryTool />; }
