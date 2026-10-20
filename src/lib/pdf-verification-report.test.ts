import {describe,expect,it} from "vitest";
import {PDFDocument} from "pdf-lib";
import {pdfFingerprint,type PdfVerificationEvidence} from "./pdf-verification-evidence";
import {buildVerificationReport} from "./pdf-verification-report";
const evidence:PdfVerificationEvidence={
  fileName:"test-original.pdf",fileSize:1234,sha256:"a".repeat(64),checkedAt:"2026-10-20T12:00:00.000Z",
  results:[{name:"Untrusted TEST signer",integrity:"intact",coverage:true,trust:"not-verified",certificate:"current",detail:"Integrity intact. Trust and revocation not verified."}],
};
describe("MSYN verification evidence and report",()=>{
  it("hashes the exact original bytes using SHA-256",async()=>{
    const bytes=new TextEncoder().encode("abc"),copy=bytes.slice();
    expect(await pdfFingerprint(bytes)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(bytes).toEqual(copy);
  });
  it("creates a separate PDF report with source fingerprint metadata",async()=>{
    const before=JSON.stringify(evidence);
    const report=await PDFDocument.load(await buildVerificationReport(evidence));
    expect(report.getTitle()).toBe("MSYN Verification Report");
    expect(report.getSubject()).toContain(evidence.sha256);
    expect(report.getPageCount()).toBeGreaterThan(0);
    expect(report.getForm().getFields()).toHaveLength(0);
    expect(JSON.stringify(evidence)).toBe(before);
  });
  it("paginates long names and many signature results",async()=>{
    const report=await PDFDocument.load(await buildVerificationReport({...evidence,fileName:"long-file-name".repeat(60)+".pdf",results:Array.from({length:20},()=>({...evidence.results[0],name:"A".repeat(180)}))}));
    expect(report.getPageCount()).toBeGreaterThan(1);
  });
  it("handles unsigned and invalid results without inventing signatures",async()=>{
    for(const results of [[],[{...evidence.results[0],integrity:"invalid" as const}]]){
      const report=await PDFDocument.load(await buildVerificationReport({...evidence,results}));
      expect(report.getPageCount()).toBeGreaterThan(0);
    }
  });
  it("rejects missing fingerprints and invalid check times",async()=>{
    await expect(buildVerificationReport({...evidence,sha256:"invalid"})).rejects.toThrow("SHA-256");
    await expect(buildVerificationReport({...evidence,checkedAt:"invalid"})).rejects.toThrow("check time");
  });
});
