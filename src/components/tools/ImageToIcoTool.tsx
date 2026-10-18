"use client";

import { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import {
  Download,
  FileImage,
  LoaderCircle,
  Copy,
  Check,
  Sparkles,
  Layers,
  Settings2,
  Monitor,
  Globe,
  Trash2,
  Plus,
} from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/browser-utils";
import { buildIcoFile, canvasToPngBytes, renderToSquareCanvas } from "@/lib/ico-generator";

const AVAILABLE_SIZES = [
  { size: 16, label: "16×16", desc: "Browser tab favicon" },
  { size: 32, label: "32×32", desc: "Taskbar & retina tab" },
  { size: 48, label: "48×48", desc: "Desktop shortcut" },
  { size: 64, label: "64×64", desc: "Windows Explorer icon" },
  { size: 128, label: "128×128", desc: "High-DPI icon" },
  { size: 256, label: "256×256", desc: "Modern full-size Windows icon" },
];

type SizePreview = {
  size: number;
  dataUrl: string;
  pngBytes: Uint8Array;
};

type GeneratedIcoResult = {
  fileName: string;
  icoBlob: Blob;
  icoUrl: string;
  fileSize: number;
  sizes: SizePreview[];
  appleTouchBlob?: Blob;
};

export function ImageToIcoTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);

  // Settings
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48, 64, 128, 256]);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "stretch">("contain");
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [customBgColor, setCustomBgColor] = useState<string>("#ffffff");

  // Output State
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedIcoResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".ico")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, SVG, etc.).");
      return;
    }

    setError(null);
    setResult(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setSourceDataUrl(url);

      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
      };
      img.onerror = () => {
        setError("Could not parse image. Please try another format.");
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((s) => s !== size);
      }
      return [...prev, size].sort((a, b) => a - b);
    });
  };

  const selectAllSizes = () => {
    setSelectedSizes(AVAILABLE_SIZES.map((s) => s.size));
  };

  const selectStandardFavicon = () => {
    setSelectedSizes([16, 32, 48]);
  };

  const generateIco = async () => {
    if (!sourceImage || !selectedFile) return;
    setGenerating(true);
    setError(null);

    try {
      const effectiveBg = bgColor === "custom" ? customBgColor : bgColor === "white" ? "#ffffff" : "transparent";
      const sizePreviews: SizePreview[] = [];

      for (const size of selectedSizes) {
        const canvas = renderToSquareCanvas(sourceImage, size, fitMode, effectiveBg);
        const pngBytes = await canvasToPngBytes(canvas);
        const dataUrl = canvas.toDataURL("image/png");
        sizePreviews.push({
          size,
          dataUrl,
          pngBytes,
        });
      }

      // Generate Apple touch icon (180x180) for web kit
      const appleCanvas = renderToSquareCanvas(sourceImage, 180, fitMode, effectiveBg);
      const appleBlob = await new Promise<Blob>((resolve) =>
        appleCanvas.toBlob((b) => resolve(b!), "image/png")
      );

      // Build single combined .ico file containing all selected resolution frames
      const icoBlob = buildIcoFile(
        sizePreviews.map((sp) => ({
          width: sp.size,
          height: sp.size,
          pngBytes: sp.pngBytes,
        }))
      );

      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      const icoUrl = URL.createObjectURL(icoBlob);

      setResult({
        fileName: `${baseName}.ico`,
        icoBlob,
        icoUrl,
        fileSize: icoBlob.size,
        sizes: sizePreviews,
        appleTouchBlob: appleBlob,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ICO icon.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadIco = () => {
    if (!result) return;
    downloadBlob(result.icoBlob, result.fileName);
  };

  const downloadSinglePng = (sp: SizePreview) => {
    const blob = new Blob([sp.pngBytes.buffer as ArrayBuffer], { type: "image/png" });
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, "") || "icon";
    downloadBlob(blob, `${baseName}-${sp.size}x${sp.size}.png`);
  };

  const downloadAllInZip = async () => {
    if (!result || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const zip = new JSZip();

    // 1. Root favicon.ico
    zip.file("favicon.ico", result.icoBlob);

    // 2. Individual PNG icons
    for (const sp of result.sizes) {
      zip.file(`favicon-${sp.size}x${sp.size}.png`, sp.pngBytes);
    }

    // 3. Apple Touch Icon
    if (result.appleTouchBlob) {
      zip.file("apple-touch-icon.png", result.appleTouchBlob);
    }

    // 4. Sample Web Manifest
    const manifest = {
      name: "My Web App",
      short_name: "App",
      icons: [
        {
          src: "/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          src: "/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          src: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    };
    zip.file("site.webmanifest", JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, `${baseName}-favicon-pack.zip`);
  };

  const copyHtmlSnippet = () => {
    const snippet = `<!-- Favicon & Touch Icons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setSourceImage(null);
    setSourceDataUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-12 text-center transition hover:border-violet-400 hover:bg-violet-50/70 cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.ico"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <FileImage className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Click or drag & drop image to convert to ICO
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Supports PNG, JPG, WEBP, SVG, GIF, BMP. Generates multi-size Windows & Favicon .ico files.
          </p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Choose Image File
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active File Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {sourceDataUrl && (
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                  <img
                    src={sourceDataUrl}
                    alt="Source"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatBytes(selectedFile.size)} • {sourceImage ? `${sourceImage.naturalWidth}×${sourceImage.naturalHeight}px` : "Loading..."}
                </p>
              </div>
            </div>

            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Change Image</span>
            </button>
          </div>

          {/* Configuration Panel */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Resolution Frame Selector */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-bold text-slate-900">ICO Resolutions Included</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={selectAllSizes}
                    className="text-violet-600 hover:text-violet-700 font-medium px-1.5 py-0.5 rounded hover:bg-violet-50"
                  >
                    All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={selectStandardFavicon}
                    className="text-violet-600 hover:text-violet-700 font-medium px-1.5 py-0.5 rounded hover:bg-violet-50"
                  >
                    Favicon Only
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {AVAILABLE_SIZES.map(({ size, label, desc }) => {
                  const isChecked = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`flex flex-col text-left p-3 rounded-xl border text-xs transition ${
                        isChecked
                          ? "border-violet-500 bg-violet-50/50 ring-1 ring-violet-500 text-slate-900"
                          : "border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sm text-slate-900">{label}</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isChecked ? "bg-violet-600" : "bg-slate-300"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 leading-snug">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout & Background Settings */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Fitting & Background</h3>
              </div>

              {/* Fit Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Scaling / Fit Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "contain", label: "Fit (Contain)", desc: "Maintain ratio" },
                      { id: "cover", label: "Fill (Crop)", desc: "Crop to fill" },
                      { id: "stretch", label: "Stretch", desc: "Scale to edges" },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFitMode(mode.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition ${
                        fitMode === mode.id
                          ? "border-violet-500 bg-violet-50 font-semibold text-violet-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>{mode.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Background Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBgColor("transparent")}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      bgColor === "transparent"
                        ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Transparent (Alpha)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("white")}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      bgColor === "white"
                        ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Solid White (#FFF)
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBgColor("custom")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        bgColor === "custom"
                          ? "border-violet-500 bg-violet-50 text-violet-900 font-semibold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Custom
                    </button>
                    {bgColor === "custom" && (
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={generateIco}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Generating Multi-Resolution ICO...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Convert to ICO ({selectedSizes.length} Resolutions)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Results Area */}
          {result && (
            <div className="space-y-6">
              {/* Main Download Bar */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                      <FileImage className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{result.fileName}</h4>
                      <p className="text-xs text-slate-600">
                        {formatBytes(result.fileSize)} • Standard Windows & Web ICO •{" "}
                        {result.sizes.map((s) => `${s.size}px`).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={downloadIco}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download .ICO</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadAllInZip}
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4 text-violet-600" />
                      <span>Download Favicon ZIP Pack</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mockup Previews: Browser Tab & Windows Icon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Browser Tab Preview */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Globe className="h-4 w-4 text-sky-500" />
                    <span>Browser Tab Simulation (16×16 & 32×32)</span>
                  </div>
                  <div className="rounded-lg border border-slate-300 bg-slate-100 p-2">
                    <div className="inline-flex items-center gap-2 rounded-t-lg bg-white px-3 py-1.5 shadow-sm text-xs font-medium text-slate-800 border-t border-l border-r border-slate-200">
                      {result.sizes[0] && (
                        <img
                          src={result.sizes[0].dataUrl}
                          alt="Tab icon"
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span className="truncate max-w-[120px]">My App Title</span>
                      <span className="text-[10px] text-slate-400">×</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded text-[11px] text-slate-500 border border-slate-200 mt-1">
                      <span className="text-emerald-600">🔒</span>
                      <span>https://myapp.com</span>
                    </div>
                  </div>
                </div>

                {/* Windows Taskbar / Shortcut Preview */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Monitor className="h-4 w-4 text-violet-600" />
                    <span>Desktop / Taskbar Shortcut Preview (48×48)</span>
                  </div>
                  <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-4">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 p-1.5 border border-slate-700">
                        {result.sizes.find((s) => s.size === 48) ? (
                          <img
                            src={result.sizes.find((s) => s.size === 48)?.dataUrl}
                            alt="48px"
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <img
                            src={result.sizes[0]?.dataUrl}
                            alt="Icon"
                            className="h-10 w-10 object-contain"
                          />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-200">My App</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Size Frames & PNG Downloads */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Individual Resolution Frames in ICO
                </h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                  {result.sizes.map((sp) => (
                    <div
                      key={sp.size}
                      className="flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center"
                    >
                      <span className="text-xs font-bold text-slate-800">{sp.size}×{sp.size}</span>
                      <div
                        className="my-3 flex items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm p-1"
                        style={{
                          width: Math.min(Math.max(sp.size + 16, 48), 96),
                          height: Math.min(Math.max(sp.size + 16, 48), 96),
                        }}
                      >
                        <img
                          src={sp.dataUrl}
                          alt={`${sp.size}px`}
                          style={{
                            width: Math.min(sp.size, 80),
                            height: Math.min(sp.size, 80),
                          }}
                          className="object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadSinglePng(sp)}
                        className="w-full flex items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                        title="Download as PNG"
                      >
                        <Download className="h-3 w-3" />
                        <span>PNG</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* HTML Embed Code Snippet */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    HTML Favicon Integration Code
                  </h4>
                  <button
                    type="button"
                    onClick={copyHtmlSnippet}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy HTML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-200 leading-relaxed">
{`<!-- Place inside your HTML <head> -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

