import { PDFDocument } from "pdf-lib";

/** Render static HTML in an isolated document; scripts and external resources are blocked. */
export async function htmlToPdf(markup: string) {
  if (!markup.trim()) throw new Error("Enter HTML or choose an HTML file first.");
  const parsed = new DOMParser().parseFromString(markup, "text/html");
  parsed.querySelectorAll("script,iframe,object,embed,base,link,meta").forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.startsWith("on") || /^(srcdoc|formaction|action)$/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }
  });
  const policy = parsed.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:;";
  parsed.head.prepend(policy);
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.style.cssText = "position:fixed;left:-100000px;top:0;width:794px;height:1123px;border:0";
  try {
    const loaded = new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve();
      frame.onerror = () => reject(new Error("Could not load the HTML document."));
    });
    frame.srcdoc = parsed.documentElement.outerHTML;
    document.body.append(frame);
    await loaded;
    const body = frame.contentDocument?.body;
    if (!body) throw new Error("Could not read the HTML document.");
    await frame.contentDocument?.fonts.ready;
    const height = Math.max(1123, body.scrollHeight, frame.contentDocument?.documentElement.scrollHeight || 0);
    if (height > 40000) throw new Error("This document is too long. Split the HTML into smaller documents.");
    const { default: html2canvas } = await import("html2canvas-pro");
    const canvas = await html2canvas(body, { width: 794, height, scale: 1, windowWidth: 794, windowHeight: 1123, backgroundColor: "#ffffff", useCORS: false, allowTaint: false, logging: false });
    const pdf = await PDFDocument.create();
    for (let offset = 0; offset < canvas.height; offset += 1123) {
      const part = document.createElement("canvas");
      part.width = 794; part.height = 1123;
      const context = part.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      context.fillStyle = "white"; context.fillRect(0, 0, 794, 1123);
      context.drawImage(canvas, 0, offset, 794, Math.min(1123, canvas.height - offset), 0, 0, 794, Math.min(1123, canvas.height - offset));
      const image = await pdf.embedPng(part.toDataURL("image/png"));
      pdf.addPage([595.28, 841.89]).drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    return pdf.save();
  } finally { frame.remove(); }
}
