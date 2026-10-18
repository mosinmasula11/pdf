import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { PDFDocument as SecureDocument } from "@cantoo/pdf-lib";
import jsQR from "jsqr";
import { protectPdfBytes, unlockPdfBytes } from "./pdf-security";
import { generateQrMatrix } from "./qr-generator";
import { translationChunks } from "./translation-chunks";
import { writePdfProperties } from "./pdf-metadata";
import { parseDelimitedText, spreadsheetColumn } from "./tabular-text";
import { tableToPdf } from "./table-pdf";

describe("PDF security", () => {
  it("authenticates passwords, preserves pages, and honors permissions", async () => {
    const original = await PDFDocument.create();
    original.addPage([300, 400]).drawText("Confidential test");
    const bytes = await original.save();
    const encrypted = await protectPdfBytes(bytes, "test-password", { restrictPrinting: true, restrictCopying: true });
    await expect(PDFDocument.load(encrypted)).rejects.toThrow();
    await expect(unlockPdfBytes(encrypted, "wrong")).rejects.toThrow();
    const encryptedStructure = await SecureDocument.load(encrypted, { ignoreEncryption: true });
    const dictionary = encryptedStructure.context.lookup(encryptedStructure.context.trailerInfo.Encrypt!)!;
    expect(dictionary.toString()).toContain("/R 6");
    const decrypted = await PDFDocument.load(await unlockPdfBytes(encrypted, "test-password"));
    expect(decrypted.isEncrypted).toBe(false);
    expect(decrypted.getPage(0).getSize()).toEqual({ width: 300, height: 400 });
    const restrictedFlags = Number(dictionary.toString().match(/\/P (-?\d+)/)?.[1]);
    expect(restrictedFlags & 4).toBe(0);
    expect(restrictedFlags & 16).toBe(0);
    const permitted = await protectPdfBytes(bytes, "test-password", { restrictPrinting: false, restrictCopying: false });
    const permittedStructure = await SecureDocument.load(permitted, { ignoreEncryption: true });
    const flags = Number(permittedStructure.context.lookup(permittedStructure.context.trailerInfo.Encrypt!)!.toString().match(/\/P (-?\d+)/)?.[1]);
    expect(flags & 4).toBe(4);
    expect(flags & 16).toBe(16);
  });
});

describe("QR encoding", () => {
  it.each(["https://example.com/qa", "Hello नमस्ते 🌍", "WIFI:S:Test\\;Network;T:WPA;P:secret;;", "x".repeat(600)])("round trips a payload through an independent decoder", (text) => {
    const matrix = generateQrMatrix(text), scale = 6, size = (matrix.length + 8) * scale;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let row = 0; row < matrix.length; row++) for (let col = 0; col < matrix.length; col++) {
      if (!matrix[row][col]) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const at = (((row + 4) * scale + dy) * size + (col + 4) * scale + dx) * 4;
        pixels[at] = pixels[at + 1] = pixels[at + 2] = 0;
      }
    }
    expect(jsQR(pixels, size, size)?.data).toBe(text);
  });
});

it("chunks all Unicode translation text within the service byte limit", () => {
  const text = "This is a long paragraph. नमस्ते 🌍\n".repeat(500);
  const chunks = translationChunks(text);
  expect(chunks.length).toBeGreaterThan(12);
  expect(chunks.join("")).toBe(text);
  expect(chunks.every((chunk) => new TextEncoder().encode(chunk).length <= 400)).toBe(true);
});

it("removes both Info and XMP metadata rather than leaving a second hidden copy", async () => {
  const original = await PDFDocument.create();
  original.addPage(); original.setAuthor("Private author");
  const metadata = original.context.stream("<author>Private author</author>", { Type: "Metadata", Subtype: "XML" });
  original.catalog.set(PDFName.of("Metadata"), original.context.register(metadata));
  const bytes = await writePdfProperties(await original.save(), { title: "", author: "", subject: "", keywords: "", creator: "", producer: "" }, true);
  const cleaned = await PDFDocument.load(bytes, { updateMetadata: false });
  expect(cleaned.context.trailerInfo.Info).toBeUndefined();
  expect(cleaned.getAuthor()).toBeUndefined();
  expect(cleaned.catalog.has(PDFName.of("Metadata"))).toBe(false);
  expect(cleaned.getPageCount()).toBe(1);
});

it("keeps quoted delimiters, newlines, quotes, and sparse spreadsheet column positions", () => {
  expect(parseDelimitedText('Name,Note\r\n"Apples, red","Line one\nLine ""two"""')).toEqual([
    ["Name", "Note"], ["Apples, red", 'Line one\nLine "two"'],
  ]);
  expect(spreadsheetColumn("AA12")).toBe(26);
  expect(spreadsheetColumn("C2")).toBe(2);
});

it("exports columns beyond the first ten onto additional PDF pages", async () => {
  const rows = [Array.from({ length: 12 }, (_, n) => `Column ${n}`), Array.from({ length: 12 }, (_, n) => `Value ${n}`)];
  const document = await PDFDocument.load(await tableToPdf(rows, "Wide table"));
  expect(document.getPageCount()).toBe(2);
});
