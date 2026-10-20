import {describe,expect,it} from "vitest";
import {hasIntactOriginal} from "./signature-result";
import type {SignatureResult} from "./pdf-signature-check";
const intact:SignatureResult={name:"Test",integrity:"intact",coverage:true,trust:"not-verified",certificate:"current",detail:"Test"};
describe("Verified original download eligibility",()=>{
  it("allows intact signatures with full file coverage without claiming trust",()=>{
    expect(hasIntactOriginal([intact])).toBe(true);
    expect(hasIntactOriginal([{...intact,coverage:false},intact])).toBe(true);
  });
  it("blocks unsigned, unsupported, invalid and partially signed files",()=>{
    expect(hasIntactOriginal()).toBe(false);
    expect(hasIntactOriginal([])).toBe(false);
    expect(hasIntactOriginal([{...intact,integrity:"invalid"}])).toBe(false);
    expect(hasIntactOriginal([{...intact,integrity:"not-verified"}])).toBe(false);
    expect(hasIntactOriginal([{...intact,coverage:false}])).toBe(false);
    expect(hasIntactOriginal([intact,{...intact,integrity:"invalid"}])).toBe(false);
  });
});
