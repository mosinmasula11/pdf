"use client";

import { useState } from "react";
import JSZip from "jszip";
import { FileText, Download, LoaderCircle, CheckCircle2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { extractTextFromPdf } from "@/lib/pdfjs-helper";

export function PdfToWordTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("converted.docx");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setPageCount(null);
    setError(null);
  };

  const convertToWord = async () => {
    if (!file) {
      setError("Please choose a PDF file to convert.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const extracted = await extractTextFromPdf(arrayBuffer);
      setPageCount(extracted.pageCount);

      // Build valid OpenXML .docx package
      const zip = new JSZip();

      // [Content_Types].xml
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      );

      // _rels/.rels
      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      );

      // word/_rels/document.xml.rels
      zip.file(
        "word/_rels/document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
      );

      // word/document.xml
      const escapeXml = (unsafe: string) => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      };

      let bodyXml = "";

      for (let i = 0; i < extracted.pagesText.length; i++) {
        const pageText = extracted.pagesText[i];
        // Page header / banner
        bodyXml += `
          <w:p>
            <w:pPr>
              <w:pStyle w:val="Heading1"/>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:color w:val="1E40AF"/><w:sz w:val="28"/></w:rPr>
              <w:t>--- Page ${i + 1} ---</w:t>
            </w:r>
          </w:p>
        `;

        const paragraphs = pageText
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        for (const p of paragraphs) {
          bodyXml += `
            <w:p>
              <w:r>
                <w:rPr><w:sz w:val="22"/></w:rPr>
                <w:t xml:space="preserve">${escapeXml(p)}</w:t>
              </w:r>
            </w:p>
          `;
        }

        // Add page break between pages
        if (i < extracted.pagesText.length - 1) {
          bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
        }
      }

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
  </w:body>
</w:document>`;

      zip.file("word/document.xml", documentXml);

      const docxBlob = await zip.generateAsync({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      setResultBlob(docxBlob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}.docx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF to Word conversion failed.");
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
          <h2 className="text-xl font-semibold text-slate-900">PDF to WORD</h2>
          <p className="text-sm text-slate-500">
            Convert PDF documents into editable Microsoft Word (.docx) files.
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
          onClick={convertToWord}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {processing ? "Extracting & Converting..." : "Convert PDF to Word (.docx)"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Converted to editable Word document! ({pageCount} pages)
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Word Document (.docx)
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

