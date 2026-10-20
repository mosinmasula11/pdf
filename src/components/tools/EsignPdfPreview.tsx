"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert, LoaderCircle } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { SignatureResult } from "@/lib/pdf-signature-check";
import { hasIntactOriginal } from "@/lib/signature-result";
import { getPdfJs } from "@/lib/pdfjs-helper";
import { formatAadhaarDate, loadTickCanvasImage, drawVerifiedStampOnCanvas } from "@/lib/pdf-verification-copy";

export function EsignPdfPreview({
  file,
  password,
  results,
  signerName,
  signingTime,
}: {
  file: File;
  password?: string;
  results: SignatureResult[];
  signerName?: string;
  signingTime?: string | null;
}) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const passed = hasIntactOriginal(results);

  const displaySigner =
    signerName?.trim() ||
    results.find((r) => r.name && r.name !== "Signer not identified")?.name ||
    "DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 03";

  const displayDate = formatAadhaarDate(signingTime || new Date());

  useEffect(() => {
    let cancelled = false;
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    void (async () => {
      try {
        const pdfjs = await getPdfJs();
        if (cancelled) return;
        const bytes = await file.arrayBuffer();
        if (cancelled) return;
        task = pdfjs.getDocument({ data: bytes, password, enableXfa: false });
        const pdf = await task.promise;
        if (cancelled) return;
        setDocument(pdf);
        setTotal(pdf.numPages);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "The preview could not be opened.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [file, password]);

  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let render: import("pdfjs-dist").RenderTask | undefined;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min(1.4, 1800 / Math.max(natural.width, natural.height)),
        });
        const offscreen = window.document.createElement("canvas");
        offscreen.width = Math.ceil(viewport.width);
        offscreen.height = Math.ceil(viewport.height);
        const context = offscreen.getContext("2d");
        if (!context) throw new Error("Canvas preview is unavailable.");
        render = page.render({ canvas: offscreen, canvasContext: context, viewport });
        await render.promise;

        // When verified, stamp the exact same verified box directly onto the canvas
        if (passed) {
          const tickImg = await loadTickCanvasImage();
          let sigBox: { x: number; y: number; width: number; height: number } | null = null;
          try {
            const annotations = await page.getAnnotations({ intent: "any" });
            for (const annotation of annotations) {
              const isSig =
                annotation.fieldType === "Sig" ||
                annotation.subtype === "Widget" ||
                (typeof annotation.fieldName === "string" && /sig/i.test(annotation.fieldName)) ||
                (typeof annotation.name === "string" && /sig/i.test(annotation.name));

              if (
                isSig &&
                Array.isArray(annotation.rect) &&
                annotation.rect.length === 4
              ) {
                const pt1 = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
                const pt2 = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
                const bx = Math.min(pt1[0], pt2[0]);
                const by = Math.min(pt1[1], pt2[1]);
                const bw = Math.abs(pt1[0] - pt2[0]);
                const bh = Math.abs(pt1[1] - pt2[1]);
                if (bw > 20 && bh > 15) {
                  sigBox = {
                    x: bx,
                    y: by,
                    width: Math.max(bw, 108 * viewport.scale),
                    height: Math.max(bh + 12 * viewport.scale, 62 * viewport.scale),
                  };
                  break;
                }
              }
            }
          } catch {
            // ignore annotation retrieval error
          }

          // Standard Aadhaar signature box fallback on page 1 if annotation is not exposed
          if (!sigBox && pageNumber === 1) {
            sigBox = {
              x: viewport.width * (24 / 595.28),
              y: viewport.height * ((841.89 - 72 - 62) / 841.89),
              width: viewport.width * (108 / 595.28),
              height: viewport.height * (62 / 841.89),
            };
          }

          if (sigBox) {
            drawVerifiedStampOnCanvas(context, sigBox, displaySigner, displayDate, tickImg);
          }
        }

        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        canvas.getContext("2d")?.drawImage(offscreen, 0, 0);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not render this page.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      render?.cancel();
    };
  }, [document, pageNumber]);

  return (
    <section aria-label="PDF verification preview" className="mt-4 border-t border-amber-200 dark:border-slate-800 pt-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div
          className={
            "flex items-center gap-2 font-semibold " +
            (passed ? "text-emerald-850 dark:text-emerald-300" : "text-amber-950 dark:text-amber-200")
          }
        >
          {passed ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
          <span>{passed ? "Cryptographic Signature Verified & Intact" : "Signature integrity not verified"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            title="Previous page"
            aria-label="Previous preview page"
            disabled={loading || pageNumber <= 1}
            onClick={() => setPageNumber((value) => value - 1)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center">
            Page {pageNumber} / {total || "..."}
          </span>
          <button
            type="button"
            title="Next page"
            aria-label="Next preview page"
            disabled={loading || pageNumber >= total}
            onClick={() => setPageNumber((value) => value + 1)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-red-800 dark:text-red-400 mb-3 text-xs">
          {error}
        </p>
      )}

      <div aria-busy={loading} className="relative bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 rounded-xl overflow-hidden">
        {loading && (
          <p role="status" className="flex gap-2 items-center justify-center text-slate-600 dark:text-slate-400 py-3 text-xs">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Rendering PDF preview...
          </p>
        )}
        <div className={"relative mx-auto max-w-3xl " + (loading ? "opacity-40" : "")}>
          <canvas
            ref={canvasRef}
            aria-label="PDF page preview with verified signature"
            className="block w-full h-auto bg-white rounded shadow-sm"
          />
        </div>
      </div>
    </section>
  );
}
