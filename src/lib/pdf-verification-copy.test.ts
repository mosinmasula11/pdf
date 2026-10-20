import {describe,it,expect,vi} from "vitest";
import {buildVerificationCopy, formatAadhaarDate} from "./pdf-verification-copy";
import type {PdfVerificationEvidence} from "./pdf-verification-evidence";
import {protectPdfBytes} from "./pdf-security";
import { PDFDocument, PDFName } from "@cantoo/pdf-lib";
import {pdfFingerprint} from "./pdf-verification-evidence";

vi.mock("./pdfjs-helper",()=>({getPdfJs:vi.fn(()=>{throw new Error("Must not render rejected evidence");})}));
const evidence:PdfVerificationEvidence={fileName:"test.pdf",fileSize:3,sha256:"0".repeat(64),checkedAt:new Date().toISOString(),results:[{name:"Test",integrity:"intact",coverage:true,trust:"not-verified",certificate:"current",detail:"Test"}]};

describe("modified verification copy safeguards",()=>{
  it("refuses invalid signatures before reading the file",async()=>{
    const read=vi.fn();
    await expect(buildVerificationCopy({arrayBuffer:read} as unknown as File,{...evidence,results:[{...evidence.results[0],integrity:"invalid"}]})).rejects.toThrow("integrity check");
    expect(read).not.toHaveBeenCalled();
  });
  it("refuses unsigned files",async()=>{
    await expect(buildVerificationCopy({} as File,{...evidence,results:[]})).rejects.toThrow("integrity check");
  });
  it("refuses evidence from another file",async()=>{
    const original=new Uint8Array([1,2,3]);
    await expect(buildVerificationCopy({arrayBuffer:async()=>original.buffer} as File,evidence)).rejects.toThrow("no longer matches");
    expect([...original]).toEqual([1,2,3]);
  });
  it("formats dates in official Aadhaar IST format YYYY.MM.DD HH:mm:ss GMT+05:30", ()=>{
    const utcDate = new Date("2023-06-12T12:59:34Z");
    const formatted = formatAadhaarDate(utcDate);
    expect(formatted).toBe("2023.06.12 18:29:34 GMT+05:30");
  });
  it("completely removes password from protected PDFs so output opens without password", async () => {
    // 1. Create a sample PDF and protect it with a password
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const cleanBytes = await doc.save();
    const protectedBytes = await protectPdfBytes(cleanBytes, "SECRET123", {
      restrictPrinting: false,
      restrictCopying: false,
    });

    const hash = await pdfFingerprint(new Uint8Array(protectedBytes));
    const testEvidence: PdfVerificationEvidence = {
      fileName: "protected.pdf",
      fileSize: protectedBytes.byteLength,
      sha256: hash,
      checkedAt: new Date().toISOString(),
      results: [
        {
          name: "DS TEST SIGNER",
          integrity: "intact",
          coverage: true,
          trust: "not-verified",
          certificate: "current",
          detail: "Intact signature",
        },
      ],
    };

    const file = {
      name: "protected.pdf",
      size: protectedBytes.byteLength,
      arrayBuffer: async () => protectedBytes.buffer.slice(protectedBytes.byteOffset, protectedBytes.byteOffset + protectedBytes.byteLength),
    } as unknown as File;

    // 2. Build verified copy with the password
    const outputBytes = await buildVerificationCopy(file, testEvidence, "SECRET123");

    // 3. Verify the output PDF loads directly WITHOUT any password and has no /Encrypt
    const openedWithoutPassword = await PDFDocument.load(outputBytes);
    expect(openedWithoutPassword.getPageCount()).toBe(1);
    expect(openedWithoutPassword.context.trailerInfo.Encrypt).toBeUndefined();
  });

  it("removes unverified signature annotations and AcroForm so ? marks never render in Acrobat", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);

    const annotDict = doc.context.obj({
      Type: "Annot",
      Subtype: "Widget",
      FT: "Sig",
      Rect: [24, 72, 148, 134],
      AP: doc.context.obj({ N: doc.context.obj({}) }),
    });
    const annotRef = doc.context.register(annotDict);
    page.node.set(PDFName.of("Annots"), doc.context.obj([annotRef]));
    doc.catalog.set(PDFName.of("AcroForm"), doc.context.obj({ Fields: [annotRef] }));

    const cleanBytes = await doc.save();
    const hash = await pdfFingerprint(new Uint8Array(cleanBytes));
    const testEvidence: PdfVerificationEvidence = {
      fileName: "signed-with-question-mark.pdf",
      fileSize: cleanBytes.byteLength,
      sha256: hash,
      checkedAt: new Date().toISOString(),
      results: [
        {
          name: "DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 03",
          integrity: "intact",
          coverage: true,
          trust: "not-verified",
          certificate: "current",
          detail: "Intact signature",
        },
      ],
    };

    const file = {
      name: "signed-with-question-mark.pdf",
      size: cleanBytes.byteLength,
      arrayBuffer: async () => cleanBytes.buffer.slice(cleanBytes.byteOffset, cleanBytes.byteOffset + cleanBytes.byteLength),
    } as unknown as File;

    const outputBytes = await buildVerificationCopy(file, testEvidence);
    const resultDoc = await PDFDocument.load(outputBytes);

    // Check that AcroForm is completely removed from catalog
    expect(resultDoc.catalog.get(PDFName.of("AcroForm"))).toBeUndefined();
    // Check that no signature widget annotations remain on the page
    const pageAnnots = resultDoc.getPage(0).node.Annots();
    expect(pageAnnots === undefined || pageAnnots.size() === 0).toBe(true);
  });
});
