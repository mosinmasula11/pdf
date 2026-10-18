"use client";

import { useState } from "react";
import JSZip from "jszip";
import { FileSpreadsheet, Download, LoaderCircle, CheckCircle2, Table } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { getPdfJs } from "@/lib/pdfjs-helper";

export function PdfToExcelTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedRows, setExtractedRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultCsvBlob, setResultCsvBlob] = useState<Blob | null>(null);
  const [resultXlsxBlob, setResultXlsxBlob] = useState<Blob | null>(null);
  const [downloadBase, setDownloadBase] = useState("extracted-table");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setExtractedRows([]);
    setResultCsvBlob(null);
    setResultXlsxBlob(null);
    setError(null);
  };

  const convertToExcel = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const allRows: string[][] = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();

        // Group items by Y coordinate with small tolerance (baseline cluster)
        const rowMap = new Map<number, Array<{ x: number; text: string }>>();

        for (const item of textContent.items as any[]) {
          if (!("transform" in item) || !item.str?.trim()) continue;
          const x = item.transform[4];
          const y = Math.round(item.transform[5]); // Y coordinate

          // Find existing bucket within 4 points
          let bucket = Array.from(rowMap.keys()).find((k) => Math.abs(k - y) <= 4);
          if (bucket === undefined) {
            bucket = y;
            rowMap.set(bucket, []);
          }
          rowMap.get(bucket)!.push({ x, text: item.str.trim() });
        }

        // Sort rows descending by Y (top of page down to bottom)
        const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);

        for (const y of sortedYs) {
          const items = rowMap.get(y)!;
          // Sort items in this row left to right by X
          items.sort((a, b) => a.x - b.x);
          const rowVals = items.map((it) => it.text);
          if (rowVals.length > 0) {
            allRows.push(rowVals);
          }
        }
      }

      if (allRows.length === 0) {
        throw new Error(
          "No structured table text could be detected. The PDF might contain images of tables without a text layer."
        );
      }

      setExtractedRows(allRows);
      const base = file.name.replace(/\.pdf$/i, "");
      setDownloadBase(base);

      // 1. Generate CSV
      const csvContent = allRows
        .map((row) =>
          row
            .map((cell) => {
              const escaped = cell.replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(",")
        )
        .join("\r\n");

      const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      setResultCsvBlob(csvBlob);

      // 2. Generate XLSX using JSZip
      const zip = new JSZip();

      // [Content_Types].xml
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
      );

      // _rels/.rels
      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
      );

      // xl/_rels/workbook.xml.rels
      zip.file(
        "xl/_rels/workbook.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
      );

      // xl/workbook.xml
      zip.file(
        "xl/workbook.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="TableData" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
      );

      // xl/worksheets/sheet1.xml
      const escapeXml = (unsafe: string) =>
        unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");

      const getColLetter = (colIndex: number): string => {
        let temp = "";
        let letter = "";
        while (colIndex > 0) {
          temp = String.fromCharCode(((colIndex - 1) % 26) + 65);
          letter = temp + letter;
          colIndex = Math.floor((colIndex - 1) / 26);
        }
        return letter;
      };

      let sheetRowsXml = "";
      allRows.forEach((row, rIdx) => {
        let cellsXml = "";
        row.forEach((cell, cIdx) => {
          const colLetter = getColLetter(cIdx + 1);
          const cellRef = `${colLetter}${rIdx + 1}`;
          cellsXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
        });
        sheetRowsXml += `<row r="${rIdx + 1}">${cellsXml}</row>`;
      });

      zip.file(
        "xl/worksheets/sheet1.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`
      );

      const xlsxBlob = await zip.generateAsync({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      setResultXlsxBlob(xlsxBlob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract table data to Excel.");
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
          <h2 className="text-xl font-semibold text-slate-900">PDF to EXCEL</h2>
          <p className="text-sm text-slate-500">
            Extract structured tables, numbers, and data rows from PDF into Excel spreadsheets.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf"
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
          onClick={convertToExcel}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4" />}
          {processing ? "Extracting Data..." : "Extract to Excel (.xlsx / .csv)"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setExtractedRows([]);
              setResultCsvBlob(null);
              setResultXlsxBlob(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {extractedRows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Found {extractedRows.length} data rows:
            </span>
            <div className="flex gap-2">
              {resultXlsxBlob && (
                <button
                  type="button"
                  onClick={() => downloadBlob(resultXlsxBlob, `${downloadBase}.xlsx`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Excel (.xlsx)
                </button>
              )}
              {resultCsvBlob && (
                <button
                  type="button"
                  onClick={() => downloadBlob(resultCsvBlob, `${downloadBase}.csv`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <tbody>
                {extractedRows.slice(0, 20).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`border-b border-slate-100 ${
                      rIdx === 0 ? "bg-slate-100 font-bold text-slate-900" : "hover:bg-slate-50"
                    }`}
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border-r border-slate-100 px-3 py-2 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {extractedRows.length > 20 && (
            <p className="text-xs text-slate-400">
              Showing first 20 rows. All {extractedRows.length} rows will be included in the downloaded file.
            </p>
          )}
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

