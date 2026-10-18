import { PDFDocument } from "pdf-lib";
import { getPdfJs } from "./pdfjs-helper";

export async function recognizePdf(bytes: ArrayBuffer, progress: (message: string) => void) {
  const pdfjs = await getPdfJs();
  const loading = pdfjs.getDocument({ data: bytes.slice(0) });
  const source = await loading.promise;
  const original = await PDFDocument.load(bytes);
  const output = await PDFDocument.create();
  const pagesText: string[] = [];
  let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
  try {
    for (let number = 1; number <= source.numPages; number++) {
      progress(`Reading page ${number} of ${source.numPages}...`);
      const page = await source.getPage(number);
      const existing = (await page.getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" ");
      if (existing.trim()) {
        pagesText.push(existing);
        const [copy] = await output.copyPages(original, [number - 1]);
        output.addPage(copy);
      } else {
        if (!worker) {
          progress("Loading local English recognition engine...");
          const { createWorker } = await import("tesseract.js");
          const local = (name: string) => new URL(`/ocr/${name}`, window.location.href).href;
          worker = await createWorker("eng", 1, {
            workerPath: local("worker.min.js"),
            corePath: local("tesseract-core-lstm.wasm.js"),
            langPath: new URL("/ocr", window.location.href).href,
            workerBlobURL: false,
            cacheMethod: "none",
          });
        }
        progress(`Recognizing scanned page ${number} of ${source.numPages}...`);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        await page.render({ canvas, canvasContext: context, viewport, background: "rgb(255,255,255)" }).promise;
        const { data } = await worker.recognize(canvas, {}, { text: true, pdf: true });
        pagesText.push(data.text.trim());
        if (!data.pdf) throw new Error("Could not build the searchable page.");
        const recognized = await PDFDocument.load(new Uint8Array(data.pdf));
        const imagePage = await output.embedPage(recognized.getPage(0));
        const dimensions = page.getViewport({ scale: 1 });
        output.addPage([dimensions.width, dimensions.height]).drawPage(imagePage, { x: 0, y: 0, width: dimensions.width, height: dimensions.height });
        canvas.width = canvas.height = 0;
      }
      page.cleanup();
    }
    return { fullText: pagesText.join("\n\n"), pagesText, pageCount: pagesText.length, bytes: await output.save() };
  } finally {
    await worker?.terminate();
    await loading.destroy();
  }
}
