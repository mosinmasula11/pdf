export type TaxYear="FY2024-25"|"FY2025-26";
export type TaxAge="below60"|"60to80"|"above80";
export function newTaxSlabs(year:TaxYear):[number,number][] {
  return year==="FY2025-26"?[[400000,0],[800000,.05],[1200000,.1],[1600000,.15],[2000000,.2],[2400000,.25],[Infinity,.3]]:[[300000,0],[700000,.05],[1000000,.1],[1200000,.15],[1500000,.2],[Infinity,.3]];
}
export function slabTax(income:number,slabs:[number,number][]) {
  let previous=0,tax=0;for(const[ceiling,rate]of slabs){tax+=Math.max(0,Math.min(income,ceiling)-previous)*rate;previous=ceiling;if(income<=ceiling)break;}return tax;
}
export function residentTax(taxable:number,regime:"old"|"new",year:TaxYear,age:TaxAge) {
  if(!Number.isFinite(taxable)||taxable<0||taxable>5000000)throw new Error("This estimate supports taxable income up to 50 lakh. Higher incomes require surcharge calculations.");
  const exempt=age==="above80"?500000:age==="60to80"?300000:250000;
  const slabs:[number,number][]=regime==="new"?newTaxSlabs(year):[[exempt,0],[500000,.05],[1000000,.2],[Infinity,.3]];
  const baseTax=slabTax(taxable,slabs),threshold=regime==="old"?500000:year==="FY2025-26"?1200000:700000;
  const cap=regime==="old"?12500:year==="FY2025-26"?60000:25000,rebate87A=taxable<=threshold?Math.min(baseTax,cap):0;
  let taxAfterRebate=baseTax-rebate87A;
  const marginalRelief=regime==="new"&&taxable>threshold?Math.max(0,taxAfterRebate-(taxable-threshold)):0;
  taxAfterRebate-=marginalRelief;const surcharge=0,cess=taxAfterRebate*.04;
  return {baseTax,rebate87A,marginalRelief,taxAfterRebate,surcharge,cess,totalTax:Math.round(taxAfterRebate+cess)};
}
