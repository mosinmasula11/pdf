"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { Presentation, Download, LoaderCircle, CheckCircle2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

interface SlideData {
  slideNumber: number;
  title: string;
  points: string[];
}

export function PowerpointToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("presentation.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setSlides([]);
    const selected = incoming[0];
    if (!/\.(pptx)$/i.test(selected.name)) { setError("Choose a PPTX file. Legacy binary formats are not supported."); setFile(null); return; }
    const name = selected.name.toLowerCase();
    if (!name.endsWith(".pptx") && !name.endsWith(".ppt")) {
      setError("Please choose a PowerPoint file (.pptx or .ppt).");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setSlides([]);
    setError(null);
  };

  const convertPptx = async () => {
    if (!file) {
      setError("Please select a PowerPoint file.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const parsedSlides: SlideData[] = [];

      if (file.name.toLowerCase().endsWith(".pptx")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        // Find all slide files: ppt/slides/slide{n}.xml
        const slideFileNames = Object.keys(zip.files)
          .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
          .sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ""), 10);
            const numB = parseInt(b.replace(/\D/g, ""), 10);
            return numA - numB;
          });

        const parser = new DOMParser();

        for (let idx = 0; idx < slideFileNames.length; idx++) {
          const sName = slideFileNames[idx];
          const xmlText = await zip.files[sName].async("string");
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const pNodes = xmlDoc.getElementsByTagName("a:p");

          let title = `Slide ${idx + 1}`;
          const points: string[] = [];

          for (let pIdx = 0; pIdx < pNodes.length; pIdx++) {
            const tNodes = pNodes[pIdx].getElementsByTagName("a:t");
            let lineText = "";
            for (let tIdx = 0; tIdx < tNodes.length; tIdx++) {
              lineText += tNodes[tIdx].textContent || "";
            }
            lineText = lineText.trim();
            if (lineText) {
              if (pIdx === 0 && !lineText.startsWith("•")) {
                title = lineText;
              } else {
                points.push(lineText);
              }
            }
          }

          parsedSlides.push({
            slideNumber: idx + 1,
            title,
            points: points.length > 0 ? points : ["(Visual presentation elements)"],
          });
        }
      }

      if (parsedSlides.length === 0) throw new Error("No slide text was found. This converter supports text-based PPTX slides, not legacy PPT files or image-only presentations.");

      setSlides(parsedSlides);

      // Create Landscape 16:9 presentation PDF (841.89 x 473.56 pt or 841.89 x 595.28)
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const slideWidth = 841.89;
      const slideHeight = 473.56;

      for (const s of parsedSlides) {
        const page = pdfDoc.addPage([slideWidth, slideHeight]);

        // Background header banner
        page.drawRectangle({
          x: 0,
          y: slideHeight - 80,
          width: slideWidth,
          height: 80,
          color: rgb(0.96, 0.97, 0.99),
        });

        // Header accent bar
        page.drawRectangle({
          x: 0,
          y: slideHeight - 4,
          width: slideWidth,
          height: 4,
          color: rgb(0.85, 0.25, 0.15), // PowerPoint orange-red
        });

        // Title
        page.drawText(s.title.slice(0, 70), {
          x: 48,
          y: slideHeight - 48,
          size: 20,
          font: helveticaBold,
          color: rgb(0.1, 0.15, 0.25),
        });

        // Slide number tag
        page.drawText(`Slide ${s.slideNumber} of ${parsedSlides.length}`, {
          x: slideWidth - 140,
          y: slideHeight - 46,
          size: 11,
          font: helvetica,
          color: rgb(0.5, 0.55, 0.65),
        });

        // Content body
        let currentY = slideHeight - 120;
        for (const pt of s.points) {
          if (currentY < 40) break;
          const cleanPt = pt.replace(/^[•\-\*]\s*/, "");
          const truncated = cleanPt.length > 95 ? cleanPt.slice(0, 95) + "..." : cleanPt;

          // bullet circle
          page.drawCircle({
            x: 52,
            y: currentY + 4,
            size: 3,
            color: rgb(0.85, 0.25, 0.15),
          });

          page.drawText(truncated, {
            x: 66,
            y: currentY,
            size: 13,
            font: helvetica,
            color: rgb(0.2, 0.25, 0.3),
          });

          currentY -= 28;
        }

        // Footer brand
        page.drawText(file.name.replace(/\.[^/.]+$/, ""), {
          x: 48,
          y: 20,
          size: 9,
          font: helvetica,
          color: rgb(0.65, 0.7, 0.75),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.[^/.]+$/, "")}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert presentation to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-orange-100 p-2 text-orange-600">
          <Presentation className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">POWERPOINT to PDF</h2>
          <p className="text-sm text-slate-500">
            Export text from PPTX slides into a simple PDF presentation. Original artwork, animations and slide layout are not preserved.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".pptx"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {file && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={convertPptx}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4" />}
          {processing ? "Converting Slides..." : "Convert PowerPoint to PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setSlides([]);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {slides.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Detected {slides.length} slides:
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {slides.slice(0, 6).map((s) => (
              <div key={s.slideNumber} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="font-bold text-slate-800 truncate">Slide {s.slideNumber}: {s.title}</div>
                <div className="mt-1 text-slate-500 text-[11px] truncate">
                  {s.points[0] || ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF presentation generated! ({slides.length} slides)
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Converted PDF Presentation
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
