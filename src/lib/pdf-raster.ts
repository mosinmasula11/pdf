import { PDFDocument } from "pdf-lib";
import { getPdfJs } from "./pdfjs-helper";

export type PageMask = { page: number; x: number; y: number; width: number; height: number };

/** Build a fresh document from visible pixels; original streams and attachments never carry over. */
export async function rasterizePdf(bytes: ArrayBuffer, masks: PageMask[] = []) {
  const pdfjs = await getPdfJs();
  const loading = pdfjs.getDocument({ data: bytes });
  const source = await loading.promise;
  const output = await PDFDocument.create();
  try {
    for (let number = 1; number <= source.numPages; number++) {
      const page = await source.getPage(number);
      const size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      await page.render({ canvas, canvasContext: context, viewport, background: "rgb(255,255,255)" }).promise;
      context.fillStyle = "#000000";
      for (const mask of masks.filter((mask) => mask.page === number)) {
        // Round outward to avoid leaving a visible strip at the edge of a mask.
        const x = Math.floor(mask.x * 2), y = Math.floor(mask.y * 2);
        context.fillRect(x, y, Math.ceil((mask.x + mask.width) * 2) - x, Math.ceil((mask.y + mask.height) * 2) - y);
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Could not render PDF page.")), "image/png",
      ));
      const image = await output.embedPng(await blob.arrayBuffer());
      output.addPage([size.width, size.height]).drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
      canvas.width = canvas.height = 0;
      page.cleanup();
    }
    return output.save();
  } finally {
    await loading.destroy();
  }
}
