"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { FileText, Download, LoaderCircle, CheckCircle2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function WordToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("document.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setExtractedPreview([]);
    const selected = incoming[0];
    if (!/\.(docx|txt)$/i.test(selected.name)) { setError("Choose a DOCX or TXT file. Legacy binary formats are not supported."); setFile(null); return; }
    const name = selected.name.toLowerCase();
    if (
      !name.endsWith(".docx") &&
      !name.endsWith(".doc") &&
      !name.endsWith(".txt") &&
      !name.endsWith(".rtf")
    ) {
      setError("Please choose a Word document (.docx, .doc, .rtf, or .txt).");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setExtractedPreview([]);
    setError(null);
  };

  const convertToPdf = async () => {
    if (!file) {
      setError("Please select a Word document to convert.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const fileName = file.name.toLowerCase();
      let paragraphs: string[] = [];

      if (fileName.endsWith(".docx")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const docXmlFile = zip.file("word/document.xml");
        if (!docXmlFile) {
          throw new Error("Invalid DOCX file structure (missing word/document.xml).");
        }
        const xmlText = await docXmlFile.async("string");

        // Parse XML paragraphs
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const pNodes = xmlDoc.getElementsByTagName("w:p");

        for (let i = 0; i < pNodes.length; i++) {
          const tNodes = pNodes[i].getElementsByTagName("w:t");
          let pText = "";
          for (let j = 0; j < tNodes.length; j++) {
            pText += tNodes[j].textContent || "";
          }
          if (pText.trim()) {
            paragraphs.push(pText.trim());
          }
        }
      } else {
        // Plain text or legacy format
        const text = await file.text();
        paragraphs = text
          .split(/\r?\n\r?\n/)
          .map((p) => p.trim())
          .filter(Boolean);
      }

      if (paragraphs.length === 0) {
        paragraphs = ["(Empty document content)"];
      }

      setExtractedPreview(paragraphs.slice(0, 5));

      // Build PDF document with pdf-lib
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw document title
      const title = file.name.replace(/\.[^/.]+$/, "");
      currentPage.drawText(title, {
        x: margin,
        y: currentY,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.15, 0.25),
      });
      currentY -= 28;

      // Divider line
      currentPage.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 1,
        color: rgb(0.85, 0.88, 0.92),
      });
      currentY -= 20;

      const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let curLine = "";

        for (const w of words) {
          const test = curLine ? `${curLine} ${w}` : w;
          const wWidth = helvetica.widthOfTextAtSize(test, fontSize);
          if (wWidth <= maxWidth) {
            curLine = test;
          } else {
            if (curLine) lines.push(curLine);
            curLine = w;
          }
        }
        if (curLine) lines.push(curLine);
        return lines;
      };

      for (const p of paragraphs) {
        const lines = wrapText(p, contentWidth, 11);

        for (const line of lines) {
          if (currentY < margin + 20) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }

          currentPage.drawText(line, {
            x: margin,
            y: currentY,
            size: 11,
            font: helvetica,
            color: rgb(0.15, 0.15, 0.15),
          });

          currentY -= 16;
        }

        currentY -= 10; // extra space between paragraphs
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
      setError(err instanceof Error ? err.message : "Failed to convert Word document to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-100 p-2 text-blue-600">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Word to PDF</h2>
          <p className="text-sm text-slate-500">
            Export DOCX or TXT text to a simple PDF. Images, tables and the original page layout are not preserved.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".docx,.doc,.txt,.rtf"
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
          onClick={convertToPdf}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {processing ? "Converting to PDF..." : "Convert Word to PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setExtractedPreview([]);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {extractedPreview.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600">
          <div className="font-semibold text-slate-800 mb-1">Document text preview:</div>
          <div className="space-y-1">
            {extractedPreview.map((p, i) => (
              <p key={i} className="line-clamp-2 italic">“{p}”</p>
            ))}
          </div>
        </div>
      )}

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF generated successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Converted PDF
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
