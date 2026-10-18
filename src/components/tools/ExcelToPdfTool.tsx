"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { FileSpreadsheet, Download, LoaderCircle, CheckCircle2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function ExcelToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [tablePreview, setTablePreview] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("spreadsheet.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setTablePreview([]);
    const selected = incoming[0];
    const name = selected.name.toLowerCase();
    if (
      !name.endsWith(".xlsx") &&
      !name.endsWith(".xls") &&
      !name.endsWith(".csv") &&
      !name.endsWith(".tsv")
    ) {
      setError("Please choose an Excel spreadsheet (.xlsx, .csv, or .tsv).");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setTablePreview([]);
    setError(null);
  };

  const convertExcel = async () => {
    if (!file) {
      setError("Please select a spreadsheet file.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      let rows: string[][] = [];

      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());

        // Parse shared strings if present
        const sharedStrings: string[] = [];
        const ssFile = zip.file("xl/sharedStrings.xml");
        if (ssFile) {
          const ssXml = await ssFile.async("string");
          const parser = new DOMParser();
          const doc = parser.parseFromString(ssXml, "text/xml");
          const siNodes = doc.getElementsByTagName("si");
          for (let i = 0; i < siNodes.length; i++) {
            const tNodes = siNodes[i].getElementsByTagName("t");
            let str = "";
            for (let j = 0; j < tNodes.length; j++) {
              str += tNodes[j].textContent || "";
            }
            sharedStrings.push(str);
          }
        }

        // Parse sheet1.xml
        const sheetFile = zip.file("xl/worksheets/sheet1.xml") || Object.values(zip.files).find(f => f.name.includes("worksheets/sheet"));
        if (!sheetFile) {
          throw new Error("Could not find worksheet data in XLSX package.");
        }

        const sheetXml = await sheetFile.async("string");
        const parser = new DOMParser();
        const doc = parser.parseFromString(sheetXml, "text/xml");
        const rowNodes = doc.getElementsByTagName("row");

        for (let r = 0; r < rowNodes.length; r++) {
          const rowNode = rowNodes[r];
          const cellNodes = rowNode.getElementsByTagName("c");
          const rowVals: string[] = [];

          for (let c = 0; c < cellNodes.length; c++) {
            const cell = cellNodes[c];
            const type = cell.getAttribute("t");
            const vNode = cell.getElementsByTagName("v")[0];
            let val = vNode?.textContent || "";

            if (type === "s" && val !== "") {
              const ssIndex = parseInt(val, 10);
              val = sharedStrings[ssIndex] || val;
            }
            rowVals.push(val.trim());
          }

          if (rowVals.some(Boolean)) {
            rows.push(rowVals);
          }
        }
      } else {
        // CSV or TSV
        const text = await file.text();
        const sep = file.name.toLowerCase().endsWith(".tsv") ? "\t" : ",";
        rows = text
          .split(/\r?\n/)
          .map((line) => line.split(sep).map((c) => c.replace(/^["']|["']$/g, "").trim()))
          .filter((r) => r.some(Boolean));
      }

      if (rows.length === 0) {
        throw new Error("The selected spreadsheet contains no data.");
      }

      setTablePreview(rows.slice(0, 6));

      // Generate Landscape PDF Report
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 841.89; // Landscape A4
      const pageHeight = 595.28;
      const margin = 40;

      // Determine max columns (limit up to 10 columns per table for visual fit)
      const maxCols = Math.min(10, Math.max(...rows.map((r) => r.length)));
      const colWidth = (pageWidth - margin * 2) / maxCols;
      const rowHeight = 22;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Title
      currentPage.drawText(file.name.replace(/\.[^/.]+$/, ""), {
        x: margin,
        y: currentY,
        size: 15,
        font: helveticaBold,
        color: rgb(0.1, 0.15, 0.25),
      });
      currentY -= 28;

      const headerRow = rows[0] || [];

      const drawHeader = (page: any, y: number) => {
        page.drawRectangle({
          x: margin,
          y: y - 5,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: rgb(0.13, 0.55, 0.32), // Excel green
        });

        for (let c = 0; c < maxCols; c++) {
          const val = (headerRow[c] || `Col ${c + 1}`).slice(0, 18);
          page.drawText(val, {
            x: margin + c * colWidth + 6,
            y: y,
            size: 9.5,
            font: helveticaBold,
            color: rgb(1, 1, 1),
          });
        }
      };

      drawHeader(currentPage, currentY);
      currentY -= rowHeight + 2;

      for (let r = 1; r < rows.length; r++) {
        if (currentY < margin + 25) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin - 20;
          drawHeader(currentPage, currentY);
          currentY -= rowHeight + 2;
        }

        const isEven = r % 2 === 0;
        currentPage.drawRectangle({
          x: margin,
          y: currentY - 5,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: isEven ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1),
          borderColor: rgb(0.9, 0.92, 0.95),
          borderWidth: 0.5,
        });

        const row = rows[r];
        for (let c = 0; c < maxCols; c++) {
          const val = (row[c] || "").slice(0, 20);
          currentPage.drawText(val, {
            x: margin + c * colWidth + 6,
            y: currentY,
            size: 8.5,
            font: helvetica,
            color: rgb(0.2, 0.25, 0.3),
          });
        }

        currentY -= rowHeight;
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
      setError(err instanceof Error ? err.message : "Failed to convert Excel to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-600">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">EXCEL to PDF</h2>
          <p className="text-sm text-slate-500">
            Convert XLSX, CSV and TSV spreadsheets into structured printable PDF reports.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept=".xlsx,.xls,.csv,.tsv"
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
          onClick={convertExcel}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          {processing ? "Converting Spreadsheet..." : "Convert Excel to PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setTablePreview([]);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {tablePreview.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sheet Preview:
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold text-slate-900">
                <tr>
                  {tablePreview[0].slice(0, 6).map((cell, idx) => (
                    <th key={idx} className="border-b px-3 py-2 border-slate-200 truncate max-w-[120px]">
                      {cell || `Col ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tablePreview.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                    {row.slice(0, 6).map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 truncate max-w-[120px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF document created successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Converted PDF Table
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
