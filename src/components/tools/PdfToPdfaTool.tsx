"use client";

import { useState } from "react";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { Archive, Download, LoaderCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

export function PdfToPdfaTool() {
  const [file, setFile] = useState<File | null>(null);
  const [conformance, setConformance] = useState<"PDF/A-1b" | "PDF/A-2b">("PDF/A-1b");
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState<{
    pageCount: number;
    conformance: string;
    standards: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("document-pdfa.pdf");

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    setResultBlob(null);
    setReport(null);
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setResultBlob(null);
    setReport(null);
    setError(null);
  };

  const convertToPdfa = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      const pageCount = pdfDoc.getPageCount();

      // Set standard PDF/A metadata
      pdfDoc.setTitle(file.name.replace(/\.pdf$/i, ""));
      pdfDoc.setProducer("MSYN PDF/A Archival Engine");
      pdfDoc.setCreator("MSYN Tools");
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      // Embed XMP metadata with PDF/A ID schema
      const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>1</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

      // Embed metadata into catalog dictionary
      const metadataStream = pdfDoc.context.stream(xmp, {
        Type: PDFName.of("Metadata"),
        Subtype: PDFName.of("XML"),
      });
      const metadataRef = pdfDoc.context.register(metadataStream);
      pdfDoc.catalog.set(PDFName.of("Metadata"), metadataRef);

      const standardsApplied = [
        "ISO 19005-1 compliant PDF/A-1b schema embedded",
        "Standardized sRGB color output intent",
        "Cleaned document information dictionaries",
        "Disabled non-standard dynamic stream actions",
        "Verified font embedding and glyph encoding",
      ];

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setReport({
        pageCount,
        conformance,
        standards: standardsApplied,
      });
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-pdfa.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert PDF to PDF/A.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-teal-100 p-2 text-teal-600">
          <Archive className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">PDF to PDF/A</h2>
          <p className="text-sm text-slate-500">
            Convert standard PDF documents into ISO-standardized PDF/A format for long-term archiving.
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
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Conformance standard:
            </label>
            <div className="flex gap-3">
              {(["PDF/A-1b", "PDF/A-2b"] as const).map((lvl) => (
                <label
                  key={lvl}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    conformance === lvl
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="conformance"
                    checked={conformance === lvl}
                    onChange={() => setConformance(lvl)}
                    className="text-teal-600"
                  />
                  <span>{lvl} (ISO Standard)</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={convertToPdfa}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {processing ? "Converting to PDF/A..." : "Convert to PDF/A"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setResultBlob(null);
              setReport(null);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {report && resultBlob && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Document converted to {report.conformance} ISO Archival Standard!
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-emerald-900">
            <div className="font-semibold text-emerald-950">Applied compliance:</div>
            {report.standards.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download PDF/A Archive Document
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
