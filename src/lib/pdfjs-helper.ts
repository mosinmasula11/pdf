/**
 * Shared helper for pdfjs-dist integration in client components
 */
export async function getPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  const pdfjs = pdfjsLib as typeof import("pdfjs-dist");

  // Only configure worker if window is defined
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    try {
      const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch {
      // Fallback worker if URL construction fails
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }
  }

  return pdfjs;
}

export async function loadPdfJsDocument(arrayBuffer: ArrayBuffer) {
  const pdfjs = await getPdfJs();
  return pdfjs.getDocument({ data: arrayBuffer }).promise;
}

export async function renderPageToCanvas(
  page: any,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context is not available.");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<{
  fullText: string;
  pagesText: string[];
  pageCount: number;
}> {
  const doc = await loadPdfJsDocument(arrayBuffer);
  const pagesText: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageString = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pagesText.push(pageString);
  }

  return {
    fullText: pagesText.join("\n\n"),
    pagesText,
    pageCount: doc.numPages,
  };
}
