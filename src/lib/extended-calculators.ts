import { add, differenceInBusinessDays, differenceInCalendarDays, format, isValid, isWeekend, parseISO } from "date-fns";
import { calculatorError } from "./calculator-math";
export function dateSpan(start: string, end: string, includeEnd: boolean) {
  const first = parseISO(start), last = parseISO(end);
  if (!isValid(first) || !isValid(last)) throw new Error("Select valid start and end dates.");
  if (first > last) throw new Error("End date must be on or after start date.");
  const totalDays = differenceInCalendarDays(last, first) + Number(includeEnd);
  const businessDays = differenceInBusinessDays(last, first) + Number(includeEnd && !isWeekend(last));
  return { totalDays, businessDays, weekendDays: totalDays-businessDays, weeksCount:Number((totalDays/7).toFixed(1)), monthsCount:Number((totalDays/30.4375).toFixed(1)), yearsCount:Number((totalDays/365.25).toFixed(2)) };
}
export function shiftDate(base:string, amount:number, unit:"days"|"weeks"|"months"|"years", operation:"add"|"subtract") {
  const date = parseISO(base);
  if (!isValid(date)) throw new Error("Select a valid base date.");
  if (!Number.isInteger(amount) || amount < 0 || amount > 100000) throw new Error("Amount must be a whole number between 0 and 100,000.");
  const target = add(date,{[unit]:amount*(operation==="add"?1:-1)});
  if (!isValid(target) || target.getFullYear()<1 || target.getFullYear()>9999) throw new Error("Result is outside the supported date range.");
  return {targetDateString:format(target,"EEEE, MMMM d, yyyy"),targetDayOfWeek:format(target,"EEEE")};
}
export function bmiInputError(height:number,weight:number,age:number) {
  return calculatorError([{label:"Age (adult screening)",value:age,min:20,max:120,whole:true},{label:"Height in cm",value:height,min:50,max:250},{label:"Weight in kg",value:weight,min:10,max:500}]);
}
export function depositProjection(type:"fd"|"rd"|"ppf",payment:number,rate:number,years:number) {
  const error=calculatorError([{label:"Deposit",value:payment,min:type==="ppf"?500:1,max:type==="ppf"?150000:100000000},{label:"Annual rate",value:rate,min:0,max:50},{label:"Tenure in years",value:years,min:type==="ppf"?15:1/12,max:50,whole:type==="ppf"}]);
  if(error)throw new Error(error);
  const months=Math.round(years*12);
  if(Math.abs(months-years*12)>.000001)throw new Error("Tenure must equal a whole number of months.");
  let investedAmount=payment,maturityValue=0;
  if(type==="fd")maturityValue=payment*(1+rate/400)**(4*years);
  else if(type==="rd"){investedAmount=payment*months;for(let m=1;m<=months;m++)maturityValue+=payment*(1+rate/400)**((months-m+1)/3);}
  else{investedAmount=payment*years;for(let y=0;y<years;y++)maturityValue=(maturityValue+payment)*(1+rate/100);}
  return {investedAmount,maturityValue:Math.round(maturityValue),interestEarned:Math.round(maturityValue-investedAmount)};
}
export function compoundProjection(principal:number,monthly:number,rate:number,years:number,frequency:number) {
  const error=calculatorError([{label:"Principal",value:principal,min:0,max:100000000},{label:"Monthly deposit",value:monthly,min:0,max:10000000},{label:"Annual rate",value:rate,min:0,max:100},{label:"Years",value:years,min:1,max:50,whole:true}]);
  if(error)throw new Error(error);
  if(![1,2,4,12,365].includes(frequency))throw new Error("Choose a supported frequency.");
  let balance=principal,invested=principal;const yearlyData=[];
  for(let year=1;year<=years;year++){for(let month=0;month<12;month++){balance=(balance+monthly)*(1+rate/(100*frequency))**(frequency/12);invested+=monthly;}yearlyData.push({year,invested:Math.round(invested),interest:Math.round(balance-invested),balance:Math.round(balance)});}
  return {yearlyData,finalBalance:Math.round(balance),totalPrincipalInvested:Math.round(invested),totalInterestEarned:Math.round(balance-invested)};
}
export function gstBreakdown(amount:number,rate:number,type:"exclusive"|"inclusive") {
  const error=calculatorError([{label:"Amount",value:amount,min:0,max:1000000000},{label:"GST rate",value:rate,min:0,max:100}]);
  if(error)throw new Error(error);
  const baseAmount=type==="exclusive"?amount:amount/(1+rate/100);
  const gstAmount=type==="exclusive"?amount*rate/100:amount-baseAmount;
  return {baseAmount,gstAmount,totalAmount:type==="exclusive"?amount+gstAmount:amount};
}
