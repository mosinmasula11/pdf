"use client";

import { Edit3, Download, LoaderCircle, CheckCircle2, Type, PenTool, Highlighter, Undo } from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";
import { usePdfEditor } from "./usePdfEditor";

export function EditPdfTool() {
  const {
    file,currentPage,totalPages,toolMode,setToolMode,brushColor,setBrushColor,brushSize,setBrushSize,
    textInput,setTextInput,processing,loading,uploading,error,resultBlob,downloadName,
    canvasRef,pdfCanvasRef,fileInputRef,handleFile,handlePointerDown,handlePointerMove,handlePointerUp,
    changePage,resetAnnotations,undo,canUndo,saveEditedPdf,clearFile,
  }=usePdfEditor();

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 sm:p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
          <Edit3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Edit PDF</h2>
          <p className="text-sm text-slate-500">
            Draw, annotate, highlight and add custom text directly onto your PDF pages.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        aria-label="Choose PDF to edit"
        disabled={processing || uploading}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files)}
        className="block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
      />

      {uploading && <p role="status" className="mt-3 text-sm text-slate-600">Opening PDF...</p>}
      {file && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading || uploading || processing}
                onClick={() => changePage(currentPage - 1)}
                className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Previous Page
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages || loading || uploading || processing}
                onClick={() => changePage(currentPage + 1)}
                className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" aria-label="Annotation tools">
            <button
              type="button"
              aria-pressed={toolMode === "draw"}
              onClick={() => setToolMode("draw")}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2.5 text-xs font-semibold transition ${
                toolMode === "draw" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              Pen Draw
            </button>
            <button
              type="button"
              aria-pressed={toolMode === "highlight"}
              onClick={() => setToolMode("highlight")}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2.5 text-xs font-semibold transition ${
                toolMode === "highlight" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Highlighter className="h-3.5 w-3.5" />
              Highlighter
            </button>
            <button
              type="button"
              aria-pressed={toolMode === "text"}
              onClick={() => setToolMode("text")}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2.5 text-xs font-semibold transition ${
                toolMode === "text" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Add Text
            </button>

            {toolMode === "draw" && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  aria-label="Annotation color"
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-lg border-0"
                />
                <select
                  aria-label="Pen thickness"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="max-w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
                >
                  <option value={2}>Thin (2px)</option>
                  <option value={4}>Medium (4px)</option>
                  <option value={8}>Thick (8px)</option>
                </select>
              </div>
            )}

            {toolMode === "text" && (
              <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                <input
                  aria-label="Annotation text"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type text, then tap the page"
                  className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-2 text-sm"
                />
              </div>
            )}

            <button type="button" title="Undo last annotation" aria-label="Undo last annotation" disabled={!canUndo || loading || processing || uploading} onClick={() => void undo()} className="p-2 rounded-md border border-slate-200 disabled:opacity-40"><Undo className="h-4 w-4" /></button>
            <button
              type="button"
              disabled={loading || processing || uploading}
              onClick={resetAnnotations}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <Undo className="h-3.5 w-3.5" />
              Reset annotations
            </button>
          </div>

          <div className="relative mx-auto min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 p-2 sm:p-4" aria-busy={loading}>
            {loading && <p role="status" className="mb-2 text-center text-sm text-slate-600">Loading page...</p>}
            <div className="relative mx-auto w-full max-w-3xl bg-white shadow-sm">
              <canvas ref={pdfCanvasRef} aria-hidden="true" className="block w-full h-auto" />
              <canvas
                ref={canvasRef}
                aria-label="PDF annotation canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                style={{touchAction:"none"}}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveEditedPdf}
          disabled={processing || loading || uploading || !file}
          className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
          {processing ? "Saving Edits..." : "Save Edited PDF"}
        </button>

        {file && (
          <button
            type="button"
            disabled={processing}
            onClick={clearFile}
            className="rounded-md border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            PDF edited and saved successfully!
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, downloadName)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Edited PDF
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
