import { describe, it, expect } from "vitest";
import { PDFDocument } from "@cantoo/pdf-lib";
import { extractPdfMetadata, restoreOriginalPdfMetadata, stripPdfMetadata } from "./pdf-metadata";

describe("pdf-metadata extraction and restoration", () => {
  it("restores original PDF metadata onto verified target PDF", async () => {
    // 1. Create original PDF with metadata
    const orig = await PDFDocument.create();
    orig.addPage([100, 100]);
    orig.setTitle("Original Aadhaar Title");
    orig.setAuthor("Unique Identification Authority");
    orig.setSubject("Identity Card Document");
    orig.setCreator("UIDAI e-Sign System");
    orig.setProducer("Aadhaar PDF Engine");
    orig.setKeywords(["aadhaar", "e-sign", "verified"]);
    const origDate = new Date("2024-01-15T10:30:00Z");
    orig.setCreationDate(origDate);
    const origBytes = await orig.save({ updateMetadata: false });

    // 2. Create target PDF with no metadata
    const target = await PDFDocument.create();
    target.addPage([100, 100]);
    const targetBytes = await target.save();

    // 3. Restore original metadata onto target
    const restoredBytes = await restoreOriginalPdfMetadata(origBytes, targetBytes);
    const restoredDoc = await PDFDocument.load(restoredBytes, { updateMetadata: false });

    expect(restoredDoc.getTitle()).toBe("Original Aadhaar Title");
    expect(restoredDoc.getAuthor()).toBe("Unique Identification Authority");
    expect(restoredDoc.getSubject()).toBe("Identity Card Document");
    expect(restoredDoc.getCreator()).toBe("UIDAI e-Sign System");
    expect(restoredDoc.getProducer()).toBe("Aadhaar PDF Engine");
    expect(restoredDoc.getKeywords()).toContain("aadhaar");
    expect(restoredDoc.getCreationDate()?.toISOString()).toBe(origDate.toISOString());
  });

  it("handles original PDF with no metadata cleanly", async () => {
    const orig = await PDFDocument.create();
    orig.addPage([100, 100]);
    const origBytes = await orig.save();

    const target = await PDFDocument.create();
    target.addPage([100, 100]);
    const targetBytes = await target.save();

    const resultBytes = await restoreOriginalPdfMetadata(origBytes, targetBytes);
    const resultDoc = await PDFDocument.load(resultBytes);

    expect(resultDoc.getTitle()).toBeFalsy();
    expect(resultDoc.getAuthor()).toBeFalsy();
  });

  it("extracts and strips metadata correctly", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.setTitle("To be stripped");
    doc.setAuthor("Secret Author");
    const bytes = await doc.save();

    const extracted = await extractPdfMetadata(bytes);
    expect(extracted?.title).toBe("To be stripped");
    expect(extracted?.author).toBe("Secret Author");

    const strippedBytes = await stripPdfMetadata(bytes);
    const strippedDoc = await PDFDocument.load(strippedBytes);
    expect(strippedDoc.getTitle()).toBeFalsy();
    expect(strippedDoc.getAuthor()).toBeFalsy();
  });
});
