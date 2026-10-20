import { describe, expect, it } from "vitest";
import { bmiInputError, compoundProjection, dateSpan, depositProjection, gstBreakdown, shiftDate } from "./extended-calculators";
import { residentTax } from "./income-tax";
import { unitData } from "../components/tools/UnitConverterTool";
describe("New calculator regressions",()=>{
  it("counts weekdays across weekends and respects inclusive end dates",()=>{
    expect(dateSpan("2026-10-16","2026-10-19",true)).toMatchObject({totalDays:4,businessDays:2,weekendDays:2});
    expect(dateSpan("2026-10-16","2026-10-19",false)).toMatchObject({totalDays:3,businessDays:1,weekendDays:2});
    expect(dateSpan("2026-10-19","2026-10-19",false).totalDays).toBe(0);
  });
  it("rejects impossible and reversed dates",()=>{
    expect(()=>dateSpan("","2026-10-20",true)).toThrow();
    expect(()=>dateSpan("2026-10-20","2026-10-19",true)).toThrow();
  });
  it("clamps month ends and leap-day offsets",()=>{
    expect(shiftDate("2025-01-31",1,"months","add").targetDateString).toBe("Friday, February 28, 2025");
    expect(shiftDate("2024-02-29",1,"years","add").targetDateString).toBe("Friday, February 28, 2025");
    expect(shiftDate("2026-10-20",0,"days","add").targetDateString).toContain("October 20, 2026");
    expect(()=>shiftDate("2026-10-20",1.5,"months","add")).toThrow();
    expect(()=>shiftDate("2026-10-20",Infinity,"days","add")).toThrow();
  });
  it("does not apply adult BMI categories to children or invalid dimensions",()=>{
    expect(bmiInputError(175,70,25)).toBe("");
    expect(bmiInputError(175,70,15)).toContain("Age");
    expect(bmiInputError(0,70,25)).toContain("Height");
  });
  it("handles zero-rate deposits and enforces PPF limits without silent clamps",()=>{
    expect(depositProjection("fd",100000,0,5)).toMatchObject({maturityValue:100000,interestEarned:0});
    expect(depositProjection("rd",1000,0,1)).toMatchObject({investedAmount:12000,maturityValue:12000});
    expect(depositProjection("fd",100000,7.1,5).maturityValue).toBe(142175);
    expect(()=>depositProjection("ppf",200000,7.1,15)).toThrow();
    expect(()=>depositProjection("rd",5000,7,1e9)).toThrow();
  });
  it("keeps compound-interest schedules consistent and validates all inputs",()=>{
    const result=compoundProjection(1000,100,0,2,12);
    expect(result).toMatchObject({finalBalance:3400,totalPrincipalInvested:3400,totalInterestEarned:0});
    expect(result.yearlyData.at(-1)?.balance).toBe(result.finalBalance);
    expect(compoundProjection(100000,0,10,1,1).finalBalance).toBe(110000);
    for (const frequency of [1, 2, 4, 12, 365]) expect(compoundProjection(1000,100,0,1,frequency).finalBalance).toBe(2200);
    expect(()=>compoundProjection(100,-1,10,10,12)).toThrow();
    expect(()=>compoundProjection(100,100,10,1.5,12)).toThrow();
  });
  it("calculates tax-inclusive GST and rejects unsafe rates",()=>{
    expect(gstBreakdown(11800,18,"inclusive")).toEqual({baseAmount:10000,gstAmount:1800,totalAmount:11800});
    expect(gstBreakdown(10000,0,"exclusive").totalAmount).toBe(10000);
    expect(()=>gstBreakdown(10000,-100,"inclusive")).toThrow();
  });
  it("distinguishes decimal storage from IEC binary storage",()=>{
    const units=unitData.storage.units;
    expect(units.find(u=>u.id==="kB")!.toBase(1)).toBe(1000);
    expect(units.find(u=>u.id==="KiB")!.toBase(1)).toBe(1024);
    expect(units.find(u=>u.id==="MiB")!.toBase(1)).toBe(1048576);
    const c=unitData.temperature.units.find(u=>u.id==="c")!,f=unitData.temperature.units.find(u=>u.id==="f")!;
    expect(f.fromBase(c.toBase(0))).toBe(32);
  });
});
describe("Year-specific resident income tax estimates",()=>{
  it("changes slabs and rebates with financial year",()=>{
    expect(residentTax(1175000,"new","FY2024-25","below60").totalTax).toBe(79300);
    expect(residentTax(1175000,"new","FY2025-26","below60").totalTax).toBe(0);
    expect(residentTax(1200000,"new","FY2025-26","below60")).toMatchObject({baseTax:60000,rebate87A:60000,totalTax:0});
  });
  it("applies marginal relief at the new-regime rebate boundary",()=>{
    expect(residentTax(1201000,"new","FY2025-26","below60").totalTax).toBe(1040);
    expect(residentTax(700001,"new","FY2024-25","below60").totalTax).toBe(1);
  });
  it("handles old-regime age exemptions and rebates",()=>{
    expect(residentTax(500000,"old","FY2025-26","below60").totalTax).toBe(0);
    expect(residentTax(600000,"old","FY2025-26","above80").totalTax).toBe(20800);
  });
  it("refuses unsupported high-income surcharge cases",()=>expect(()=>residentTax(5000001,"new","FY2025-26","below60")).toThrow("surcharge"));
});
