import { PDFDocument, PDFName, PDFRef, StandardFonts, rgb, type PDFPage, type PDFFont, type PDFImage } from "@cantoo/pdf-lib";
import { getPdfJs } from "./pdfjs-helper";
import { pdfFingerprint, type PdfVerificationEvidence } from "./pdf-verification-evidence";
import { hasIntactOriginal } from "./signature-result";

export interface VerificationCopyOptions {
  signerName?: string;
  signingTime?: string | Date | null;
}

/**
 * Splits text into wrapped lines fitting within maxChars.
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Formats a Date object or string into Aadhaar IST format: YYYY.MM.DD HH:mm:ss IST
 */
export function formatAadhaarDate(dateInput?: Date | string | null): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().replace("T", " ").substring(0, 19) + " IST";
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = getPart("hour");
    const minute = getPart("minute");
    const second = getPart("second");
    return `${year}.${month}.${day} ${hour}:${minute}:${second} GMT+05:30`;
  } catch {
    return new Date().toISOString().replace("T", " ").substring(0, 19) + " GMT+05:30";
  }
}

/**
 * Loads the user's custom green tick image bytes from public/tik/righttik.png
 */
async function loadTickImageBytes(): Promise<Uint8Array | null> {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    try {
      const res = await fetch("/tik/righttik.png");
      if (res.ok) {
        return new Uint8Array(await res.arrayBuffer());
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Loads the user's custom green tick image as an HTMLImageElement for canvas rendering.
 */
export async function loadTickCanvasImage(): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined" || typeof Image === "undefined") return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/tik/righttik.png";
  });
}

/**
 * Stamps the official verified signature box (Green Tick ✔ + "Signature valid")
 * directly onto the page with a clean thin black border, calibrated so Date & Time fit perfectly.
 */
function drawVerifiedSignatureStamp(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  rect: { x: number; y: number; width: number; height: number },
  signerName: string,
  signingDate: string,
  tickImage?: PDFImage | null
) {
  // Compact width and expand height downward so Date & Time fit comfortably inside the box
  const originalTop = rect.y + rect.height;
  const width = Math.max(rect.width, 108);
  const height = Math.max(rect.height + 12, 62);
  const x = rect.x;
  const y = originalTop - height; // Keeps top edge in place so it never moves upward into PIN code

  // 1. Draw solid white background with thin black border
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(1, 1, 1),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.8,
  });

  // 2. Draw Green Checkmark WATERMARK centered in the middle of the box (behind text)
  if (tickImage) {
    const tickW = width * 0.46;
    const tickH = height * 0.76;
    const tickX = x + (width - tickW) / 2;
    const tickY = y + (height - tickH) / 2;
    page.drawImage(tickImage, {
      x: tickX,
      y: tickY,
      width: tickW,
      height: tickH,
      opacity: 0.85,
    });
  } else {
    // Vector fallback checkmark
    const tickStartX = x + width * 0.36;
    const tickStartY = y + height * 0.52;
    const tickMidX = x + width * 0.48;
    const tickMidY = y + height * 0.22;
    const tickEndX = x + width * 0.68;
    const tickEndY = y + height * 0.78;

    const outlineThickness = Math.max(3.0, height * 0.065);
    const greenThickness = Math.max(1.9, height * 0.042);

    const black = rgb(0, 0, 0);
    page.drawLine({
      start: { x: tickStartX, y: tickStartY },
      end: { x: tickMidX, y: tickMidY },
      thickness: outlineThickness,
      color: black,
      opacity: 0.85,
    });
    page.drawLine({
      start: { x: tickMidX, y: tickMidY },
      end: { x: tickEndX, y: tickEndY },
      thickness: outlineThickness,
      color: black,
      opacity: 0.85,
    });

    const green = rgb(0.08, 0.65, 0.22);
    page.drawLine({
      start: { x: tickStartX, y: tickStartY },
      end: { x: tickMidX, y: tickMidY },
      thickness: greenThickness,
      color: green,
      opacity: 0.85,
    });
    page.drawLine({
      start: { x: tickMidX, y: tickMidY },
      end: { x: tickEndX, y: tickEndY },
      thickness: greenThickness,
      color: green,
      opacity: 0.85,
    });
  }

  // 3. Draw "Signature valid" title header in foreground on top of watermark
  const titleSize = Math.max(8.5, Math.min(10.5, height * 0.17));
  page.drawText("Signature valid", {
    x: x + 4,
    y: y + height - titleSize - 3,
    size: titleSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // 4. Draw Signer Details and Signing Date in foreground on top of watermark
  const textSize = Math.max(4.8, Math.min(5.8, height * 0.105));
  const lineHeight = textSize * 1.25;

  const words = signerName.split(/\s+/);
  const signerLines: string[] = [];
  let cur = "Digitally signed by";
  for (const w of words) {
    if ((cur + " " + w).length <= 28) {
      cur += " " + w;
    } else {
      signerLines.push(cur);
      cur = w;
    }
  }
  if (cur) signerLines.push(cur);

  const dateParts = signingDate.split(/\s+/);
  let dateLine1 = `Date: ${dateParts.slice(0, 2).join(" ")}`;
  let dateLine2 = dateParts.slice(2).join(" ");
  if (!dateLine2) {
    dateLine1 = `Date: ${signingDate}`;
    dateLine2 = "";
  }
  const allLines = [...signerLines, dateLine1, ...(dateLine2 ? [dateLine2] : [])];

  let currentY = y + height - titleSize - 4 - lineHeight;
  for (const line of allLines) {
    if (currentY >= y + 2) {
      page.drawText(line, {
        x: x + 4,
        y: currentY,
        size: textSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }
  }
}

/**
 * Stamps the verified green tick box directly onto the rendered HTML canvas at the exact
 * pixel location of the signature annotation, with thin black border.
 */
export function drawVerifiedStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  signerName: string,
  signingDate: string,
  tickImg?: CanvasImageSource | null
) {
  const width = box.width;
  const height = box.height;
  const x = box.x;
  const y = box.y;

  ctx.save();
  // 1. Fill solid white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);

  // 2. Draw Green Checkmark WATERMARK centered in the middle of the box (behind text)
  if (tickImg) {
    const tickW = width * 0.46;
    const tickH = height * 0.76;
    const tickX = x + (width - tickW) / 2;
    const tickY = y + (height - tickH) / 2;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(tickImg, tickX, tickY, tickW, tickH);
    ctx.restore();
  } else {
    // Vector fallback
    const tickStartX = x + width * 0.36;
    const tickStartY = y + height * 0.48;
    const tickMidX = x + width * 0.48;
    const tickMidY = y + height * 0.78;
    const tickEndX = x + width * 0.68;
    const tickEndY = y + height * 0.22;

    const outlineStroke = Math.max(2.0, height * 0.05);
    const greenStroke = Math.max(1.5, height * 0.035);

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = outlineStroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(tickStartX, tickStartY);
    ctx.lineTo(tickMidX, tickMidY);
    ctx.lineTo(tickEndX, tickEndY);
    ctx.stroke();

    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = greenStroke;
    ctx.beginPath();
    ctx.moveTo(tickStartX, tickStartY);
    ctx.lineTo(tickMidX, tickMidY);
    ctx.lineTo(tickEndX, tickEndY);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Crisp thin black border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(0.8, height * 0.012);
  ctx.strokeRect(x, y, width, height);

  // 4. Header title "Signature valid" in foreground on top of watermark
  const titleFontSize = height * 0.165;
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${Math.round(titleFontSize)}px Helvetica, Arial, sans-serif`;
  ctx.textBaseline = "top";
  const pad = Math.max(3, height * 0.055);
  ctx.fillText("Signature valid", x + pad, y + pad);

  // 5. Format signer and date lines in foreground on top of watermark
  const bodyFontSize = height * 0.095;
  const lineHeight = bodyFontSize * 1.25;
  ctx.fillStyle = "#000000";
  ctx.font = `${Math.round(bodyFontSize)}px Helvetica, Arial, sans-serif`;

  const words = signerName.split(/\s+/);
  const signerLines: string[] = [];
  let cur = "Digitally signed by";
  for (const w of words) {
    if ((cur + " " + w).length <= 28) {
      cur += " " + w;
    } else {
      signerLines.push(cur);
      cur = w;
    }
  }
  if (cur) signerLines.push(cur);

  const dateParts = signingDate.split(/\s+/);
  let dateLine1 = `Date: ${dateParts.slice(0, 2).join(" ")}`;
  let dateLine2 = dateParts.slice(2).join(" ");
  if (!dateLine2) {
    dateLine1 = `Date: ${signingDate}`;
    dateLine2 = "";
  }
  const allLines = [...signerLines, dateLine1, ...(dateLine2 ? [dateLine2] : [])];

  let textY = y + titleFontSize + pad * 1.4;
  for (const line of allLines) {
    if (textY + bodyFontSize <= y + height) {
      ctx.fillText(line, x + pad, textY);
      textY += lineHeight;
    }
  }

  ctx.restore();
}

/**
 * Builds a verified copy of the PDF where the unverified signature box (yellow ?)
 * is updated with the verified green tick ✔ and valid signer details.
 */
export async function buildVerificationCopy(
  file: File,
  evidence: PdfVerificationEvidence,
  password?: string,
  onProgress?: (page: number, total: number) => void,
  options?: VerificationCopyOptions
): Promise<Uint8Array> {
  if (!hasIntactOriginal(evidence.results)) {
    throw new Error("The original must pass the integrity check first.");
  }
  const bytes = await file.arrayBuffer();
  if ((await pdfFingerprint(new Uint8Array(bytes))) !== evidence.sha256) {
    throw new Error("The file no longer matches the checked original.");
  }

  // Determine signer name and signing date
  const signerName =
    options?.signerName?.trim() ||
    evidence.results.find((r) => r.name && r.name !== "Signer not identified")?.name ||
    "DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 03";

  const signingDate = formatAadhaarDate(options?.signingTime || evidence.checkedAt);

  // 1. For unencrypted PDFs, attempt direct vector loading to preserve crisp text and vector elements
  // We ONLY use direct vector loading if the PDF is genuinely unencrypted or successfully decrypted.
  // We NEVER use { ignoreEncryption: true } because stripping /Encrypt from an encrypted document leaves
  // raw ciphertext streams, which renders as a completely BLANK / EMPTY PDF.
  try {
    const directDoc = await PDFDocument.load(bytes, password ? { password } : {});

    if (directDoc.getPageCount() > 0) {
      if (directDoc.context?.trailerInfo) {
        directDoc.context.trailerInfo.Encrypt = undefined;
      }

      // 1. Locate and strip the signature annotation directly in pdf-lib
      // This extracts the exact PDF /Rect coordinates of the original yellow ? box,
      // completely deletes the unverified signature annotation from all pages, and
      // removes AcroForm from catalog so Acrobat Reader cannot render any yellow ? or warning banners.
      let sigPageNum = 1;
      let sigRect: { x: number; y: number; width: number; height: number } | null = null;

      const toNum = (obj: unknown): number => {
        const resolved = directDoc.context.lookup(obj as any) as any;
        if (typeof resolved?.asNumber === "function") return resolved.asNumber();
        if (typeof resolved?.value === "number") return resolved.value;
        const n = Number(resolved);
        return isNaN(n) ? 0 : n;
      };

      const parseRect = (rawRectObj: unknown): { x: number; y: number; width: number; height: number } | null => {
        if (!rawRectObj) return null;
        const resolved = directDoc.context.lookup(rawRectObj as any) as any;
        if (!resolved) return null;

        // If resolved is a PDFArray
        if (typeof resolved.size === "function" && resolved.size() === 4) {
          const x1 = toNum(resolved.get(0));
          const y1 = toNum(resolved.get(1));
          const x2 = toNum(resolved.get(2));
          const y2 = toNum(resolved.get(3));
          const w = Math.abs(x2 - x1);
          const h = Math.abs(y2 - y1);
          if (w > 10 && h > 10) {
            return {
              x: Math.min(x1, x2),
              y: Math.min(y1, y2),
              width: w,
              height: h,
            };
          }
        }
        // If resolved has asRectangle()
        if (typeof resolved.asRectangle === "function") {
          try {
            const r = resolved.asRectangle();
            if (r && r.width > 10 && r.height > 10) return r;
          } catch {
            // ignore
          }
        }
        return null;
      };

      // Scan all pages to locate signature rectangle and strip all signature widgets
      for (let p = 0; p < directDoc.getPageCount(); p++) {
        const page = directDoc.getPage(p);
        const annots = page.node.Annots();
        if (annots && typeof annots.size === "function") {
          const remaining: unknown[] = [];
          for (let i = 0; i < annots.size(); i++) {
            const annotRef = annots.get(i);
            const annotDict = directDoc.context.lookup(annotRef) as unknown as Record<string, unknown> & {
              get?: (key: unknown) => unknown;
              delete?: (key: unknown) => unknown;
            };

            if (annotDict && typeof annotDict.get === "function") {
              const subtype = directDoc.context.lookup(annotDict.get(PDFName.of("Subtype")) as any)?.toString();
              const ft = directDoc.context.lookup(annotDict.get(PDFName.of("FT")) as any)?.toString();
              const parentObj = directDoc.context.lookup(annotDict.get(PDFName.of("Parent")) as any) as Record<string, unknown> & {
                get?: (k: unknown) => unknown;
              } | undefined;
              const parentFt = parentObj && typeof parentObj.get === "function"
                ? directDoc.context.lookup(parentObj.get(PDFName.of("FT")) as any)?.toString()
                : undefined;
              const name = directDoc.context.lookup(annotDict.get(PDFName.of("T")) as any)?.toString() || "";

              const isSig =
                ft === "/Sig" ||
                parentFt === "/Sig" ||
                subtype === "/Widget" ||
                /sig/i.test(name);

              if (isSig) {
                const rect =
                  parseRect(annotDict.get(PDFName.of("Rect"))) ||
                  (parentObj && typeof parentObj.get === "function" ? parseRect(parentObj.get(PDFName.of("Rect"))) : null);

                if (rect && !sigRect) {
                  sigRect = rect;
                  sigPageNum = p + 1;
                }

                // Delete appearance stream and omit from remaining annotations
                annotDict.delete?.(PDFName.of("AP"));
                continue;
              }
            }
            remaining.push(annotRef);
          }

          if (remaining.length > 0) {
            page.node.set(PDFName.of("Annots"), directDoc.context.obj(remaining as any));
          } else {
            page.node.delete(PDFName.of("Annots"));
          }
        }
      }

      // Check AcroForm Fields in Catalog if signature rectangle was not found in page annotations
      const acroFormObj = directDoc.catalog.get(PDFName.of("AcroForm"));
      if (acroFormObj) {
        const acroFormDict = directDoc.context.lookup(acroFormObj) as unknown as Record<string, unknown> & {
          get?: (k: unknown) => unknown;
        };
        if (acroFormDict && typeof acroFormDict.get === "function") {
          const fieldsObj = directDoc.context.lookup(acroFormDict.get(PDFName.of("Fields")) as any);
          if (fieldsObj && typeof (fieldsObj as any).size === "function") {
            const fieldsArr = fieldsObj as unknown as { size: () => number; get: (idx: number) => unknown };
            for (let i = 0; i < fieldsArr.size(); i++) {
              const fieldDict = directDoc.context.lookup(fieldsArr.get(i) as any) as unknown as Record<string, unknown> & {
                get?: (k: unknown) => unknown;
                delete?: (k: unknown) => unknown;
              };
              if (fieldDict && typeof fieldDict.get === "function") {
                const rect = parseRect(fieldDict.get(PDFName.of("Rect")));
                if (rect && !sigRect) {
                  sigRect = rect;
                }
                fieldDict.delete?.(PDFName.of("AP"));
              }
            }
          }
        }
      }

      // Remove AcroForm, Perms, and SigFlags so Acrobat Reader treats this document as a clean static PDF
      directDoc.catalog.delete(PDFName.of("AcroForm"));
      directDoc.catalog.delete(PDFName.of("Perms"));
      directDoc.catalog.delete(PDFName.of("SigFlags"));

      // Wipe all metadata (XMP metadata packet and Document Info trailer dictionary)
      const meta = directDoc.catalog.get(PDFName.of("Metadata"));
      if (meta instanceof PDFRef) directDoc.context.delete(meta);
      directDoc.catalog.delete(PDFName.of("Metadata"));
      const info = directDoc.context.trailerInfo.Info;
      if (info instanceof PDFRef) directDoc.context.delete(info);
      directDoc.context.trailerInfo.Info = undefined;

      // Fallback: If no annotation rect was detected, use standard Aadhaar card signature coordinates
      if (!sigRect || sigRect.width < 10 || sigRect.height < 10) {
        sigRect = {
          x: 24,
          y: 72,
          width: 112,
          height: 54,
        };
      }

      const font = await directDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await directDoc.embedFont(StandardFonts.HelveticaBold);
      const page = directDoc.getPage(Math.min(sigPageNum - 1, directDoc.getPageCount() - 1));
      let tickImage: PDFImage | null = null;
      try {
        const tickBytes = await loadTickImageBytes();
        if (tickBytes) {
          tickImage = await directDoc.embedPng(tickBytes);
        }
      } catch {
        // vector fallback
      }
      drawVerifiedSignatureStamp(page, font, boldFont, sigRect, signerName, signingDate, tickImage);
      return await directDoc.save({ useObjectStreams: false });
    }
  } catch {
    // If direct load throws (e.g. encrypted with custom ciphers or password-protected),
    // proceed to full-fidelity PDF.js decryption pipeline below.
  }

  // 2. Full-fidelity decryption pipeline via PDF.js:
  // PDF.js fully decrypts all Aadhaar/Adobe encryption algorithms, renders all text/photos/vectors,
  // and embeds into a clean, brand-new unencrypted PDF document.
  const pdfjs = await getPdfJs();
  let task: import("pdfjs-dist").PDFDocumentLoadingTask;
  try {
    task = pdfjs.getDocument({ data: bytes.slice(), password, enableXfa: false });
  } catch (initErr) {
    throw new Error(
      initErr instanceof Error ? initErr.message : "Failed to initialize PDF decryption."
    );
  }

  try {
    let source: import("pdfjs-dist").PDFDocumentProxy;
    try {
      source = await task.promise;
    } catch (openErr) {
      const errName = (openErr as { name?: string })?.name || "";
      if (errName === "PasswordException") {
        throw new Error("This PDF is password-protected. Please enter your PDF password to unlock and create the verified document.");
      }
      throw openErr;
    }
    if (source.numPages > 100) {
      throw new Error("Modified copies are limited to 100 pages. Download the original and report instead.");
    }

    const output = await PDFDocument.create();
    // Wipe all metadata on output PDF
    output.catalog.delete(PDFName.of("Metadata"));
    output.context.trailerInfo.Info = undefined;

    const tickImg = await loadTickCanvasImage();

    for (let index = 1; index <= source.numPages; index++) {
      onProgress?.(index, source.numPages);
      const original = await source.getPage(index);
      const natural = original.getViewport({ scale: 1 });
      const scale = Math.min(2.5, 2400 / Math.max(natural.width, natural.height));
      const viewport = original.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PDF rendering is unavailable.");

      try {
        // Ensure pure white background behind all rendered text and graphics
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 1. Render original decrypted page from PDF.js
        await original.render({ canvas, canvasContext: context, viewport }).promise;

        // 2. Locate signature widget annotations on this page to find exact pixel location of yellow ?
        let sigBox: { x: number; y: number; width: number; height: number } | null = null;
        try {
          const annotations = await original.getAnnotations({ intent: "any" });
          for (const annot of annotations) {
            const isSig =
              annot.fieldType === "Sig" ||
              annot.subtype === "Widget" ||
              (annot.fieldName && /sig/i.test(annot.fieldName)) ||
              (annot.name && /sig/i.test(annot.name));

            if (isSig && Array.isArray(annot.rect) && annot.rect.length === 4) {
              const pt1 = viewport.convertToViewportPoint(annot.rect[0], annot.rect[1]);
              const pt2 = viewport.convertToViewportPoint(annot.rect[2], annot.rect[3]);
              const bx = Math.min(pt1[0], pt2[0]);
              const by = Math.min(pt1[1], pt2[1]);
              const bw = Math.abs(pt1[0] - pt2[0]);
              const bh = Math.abs(pt1[1] - pt2[1]);
              if (bw > 20 && bh > 15) {
                sigBox = {
                  x: bx,
                  y: by,
                  width: Math.max(bw, 108 * scale),
                  height: Math.max(bh + 12 * scale, 62 * scale),
                };
                break;
              }
            }
          }
        } catch {
          // ignore annotation retrieval error
        }

        // If on page 1 of Aadhaar and annotation rect was not exposed, fallback to Aadhaar box coordinates
        if (!sigBox && index === 1) {
          sigBox = {
            x: viewport.width * (24 / 595.28),
            y: viewport.height * ((841.89 - 72 - 62) / 841.89),
            width: viewport.width * (108 / 595.28),
            height: viewport.height * (62 / 841.89),
          };
        }

        // 3. Stamp verified box directly over the yellow ? in the exact canvas area
        if (sigBox) {
          drawVerifiedStampOnCanvas(context, sigBox, signerName, signingDate, tickImg);
        }

        // 4. Embed the verified page image into the output PDF
        const image = await output.embedPng(canvas.toDataURL("image/png"));
        const page = output.addPage([natural.width, natural.height]);
        page.drawImage(image, { x: 0, y: 0, width: natural.width, height: natural.height });
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        original.cleanup();
      }
    }
    return await output.save();
  } finally {
    await task.destroy();
  }
}
