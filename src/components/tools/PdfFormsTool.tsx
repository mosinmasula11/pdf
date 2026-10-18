"use client";

import { useState } from "react";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from "pdf-lib";
import { FormInput, Download, LoaderCircle, CheckCircle2, CheckSquare } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";

interface FormFieldItem {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "other";
  value: string | boolean;
  options?: string[];
}

export function PdfFormsTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [flatten, setFlatten] = useState<boolean>(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("filled-form.pdf");

  const handleFile = async (incoming: FileList | null) => {
    if (!incoming || !incoming[0]) return;
    const selected = incoming[0];
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      const rawFields = form.getFields();

      const fieldList: FormFieldItem[] = [];

      for (const f of rawFields) {
        const name = f.getName();
        if (f instanceof PDFTextField) {
          fieldList.push({
            name,
            type: "text",
            value: f.getText() || "",
          });
        } else if (f instanceof PDFCheckBox) {
          fieldList.push({
            name,
            type: "checkbox",
            value: f.isChecked(),
          });
        } else if (f instanceof PDFDropdown) {
          fieldList.push({
            name,
            type: "dropdown",
            value: f.getSelected()[0] || "",
            options: f.getOptions(),
          });
        } else {
          fieldList.push({
            name,
            type: "other",
            value: "",
          });
        }
      }

      setFile(selected);
      setFields(fieldList);
      setResultBlob(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF form.");
    }
  };

  const updateFieldValue = (name: string, value: string | boolean) => {
    setFields((prev) =>
      prev.map((f) => (f.name === name ? { ...f, value } : f))
    );
  };

  const saveForm = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();

      for (const item of fields) {
        try {
          if (item.type === "text") {
            const field = form.getTextField(item.name);
            field.setText(String(item.value));
          } else if (item.type === "checkbox") {
            const field = form.getCheckBox(item.name);
            if (item.value) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (item.type === "dropdown") {
            const field = form.getDropdown(item.name);
            if (item.value) {
              field.select(String(item.value));
            }
          }
        } catch {
          // ignore fields that might have changed
        }
      }

      if (flatten) {
        form.flatten();
      }

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([buffer], { type: "application/pdf" });
      setResultBlob(blob);
      setDownloadName(`${file.name.replace(/\.pdf$/i, "")}-filled.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PDF form.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-100 p-2 text-sky-600">
          <FormInput className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">PDF Forms Filler</h2>
          <p className="text-sm text-slate-500">
            Fill interactive form fields, check boxes, and export filled PDF documents.
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
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{file.name}</span> • {formatBytes(file.size)} • Found {fields.length} form field(s)
          </div>

          {fields.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              This PDF document does not contain interactive form fields (AcroForms). You can still flatten and save it, or use the <strong>Edit PDF</strong> tool to stamp text anywhere on the page.
            </div>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 p-4">
              {fields.map((f) => (
                <div key={f.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {f.name} <span className="text-[10px] text-slate-400">({f.type})</span>
                  </label>

                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(f.value)}
                        onChange={(e) => updateFieldValue(f.name, e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Check / Mark this field</span>
                    </label>
                  ) : f.type === "dropdown" && f.options ? (
                    <select
                      value={String(f.value)}
                      onChange={(e) => updateFieldValue(f.name, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <option value="">-- Select option --</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(f.value)}
                      onChange={(e) => updateFieldValue(f.name, e.target.value)}
                      placeholder={`Enter ${f.name}`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-sky-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={flatten}
              onChange={(e) => setFlatten(e.target.checked)}
              className="rounded text-sky-600"
            />
            Flatten form (Lock filled fields permanently so they cannot be modified)
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveForm}
          disabled={processing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FormInput className="h-4 w-4" />}
          {processing ? "Saving Form..." : "Save Filled PDF"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setFields([]);
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
            PDF Form saved successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Filled PDF
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

