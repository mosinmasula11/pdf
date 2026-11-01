"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Braces, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileCode2, FileText, FolderOpen, ImageIcon, LoaderCircle, PanelLeftClose, PanelLeftOpen, Pencil, Play, Plus, Search, Square, Trash2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { LATEX_TEMPLATES, LATEX_LIMIT, latexOutline, newLatexProject, validateLatexProject, validLatexPath, type LatexProject } from "@/lib/latex-project";
import { LatexCompiler } from "@/lib/latex-engine";
import { loadLatexProject, saveLatexProject } from "@/lib/latex-storage";
import { downloadBlob } from "@/lib/browser-utils";
import { getPdfJs } from "@/lib/pdfjs-helper";

const buttonClass = "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
type Dialog = "new" | "rename" | "delete" | "templates" | "import" | null;

export function LatexEditorTool() {
  const [project, setProject] = useState<LatexProject>(() => newLatexProject());
  const [activePath, setActivePath] = useState("main.tex");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("Loading project…");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [log, setLog] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [compiledSource, setCompiledSource] = useState("");
  const [auto, setAuto] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [mobilePane, setMobilePane] = useState<"source" | "preview">("source");
  const [split, setSplit] = useState(50);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingImport, setPendingImport] = useState<LatexProject | null>(null);
  const saveAllowed = useRef(false);
  const [filename, setFilename] = useState("");
  const [template, setTemplate] = useState("article");
  const [find, setFind] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const editor = useRef<HTMLTextAreaElement>(null);
  const lineNumbers = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const engine = useRef<LatexCompiler | null>(null);
  const compiling = useRef(false);
  const lastAttempt = useRef("");
  const workspace = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const file = project.files.find(item => item.path === activePath) || project.files[0];
  const source = file.binary ? "" : file.content;
  const fingerprint = JSON.stringify({ ...project, files: project.files.map(item => ({ path: item.path, content: item.content, binary: !!item.binary })) });
  const stale = !!pdf && compiledSource !== fingerprint;
  const outline = useMemo(() => latexOutline(source), [source]);

  useEffect(() => {
    let mounted = true;
    void loadLatexProject().then(stored => { if (mounted) { saveAllowed.current = true; if (stored) { setProject(stored); setActivePath(stored.main); } setSaveState("Saved on this device"); } }).catch(() => { if (mounted) setSaveState("Storage unavailable · download your source to keep it"); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; engine.current?.stop(); };
  }, []);
  useEffect(() => {
    if (!ready || !saveAllowed.current) return;
    const timer = setTimeout(() => { void saveLatexProject(project).then(() => setSaveState("Saved on this device")).catch(() => setSaveState("Could not save · download your source to keep it")); }, 500);
    return () => clearTimeout(timer);
  }, [project, ready]);
  useEffect(() => { if (dialog) dialogRef.current?.showModal(); else dialogRef.current?.close(); }, [dialog]);

  const compile = useCallback(async () => {
    if (compiling.current) return;
    compiling.current = true; setBusy(true); setError("");
    try {
      const snapshot = validateLatexProject(project);
      lastAttempt.current = JSON.stringify(snapshot);
      engine.current ||= new LatexCompiler();
      const result = await engine.current.compile(snapshot, setPhase);
      setLog(result.log);
      if (result.status !== 0 || !result.pdf) { setError("Compilation failed. Check the log below."); setShowLog(true); return; }
      setPdf(result.pdf); setCompiledSource(JSON.stringify(snapshot)); setPhase("Compiled successfully");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Compilation failed."); }
    finally { compiling.current = false; setBusy(false); }
  }, [project]);
  useEffect(() => {
    if (!auto || !ready || busy || compiledSource === fingerprint || lastAttempt.current === fingerprint) return;
    const timer = setTimeout(() => void compile(), 1600);
    return () => clearTimeout(timer);
  }, [auto, ready, busy, fingerprint, compiledSource, compile]);
  const updateSource = (value: string) => {
    setProject(previous => ({ ...previous, files: previous.files.map(item => item.path === file.path ? { ...item, content: value } : item) }));
    setSaveState("Saving…");
  };
  const jump = (position: number) => { setMobilePane("source"); requestAnimationFrame(() => { editor.current?.focus(); editor.current?.setSelectionRange(position, position); if (editor.current) editor.current.scrollTop = Math.max(0, source.slice(0, position).split("\n").length * 24 - 100); }); };
  const insert = (before: string, after = "") => {
    if (!editor.current || file.binary) return;
    const { selectionStart: start, selectionEnd: end } = editor.current;
    updateSource(source.slice(0, start) + before + source.slice(start, end) + after + source.slice(end));
    requestAnimationFrame(() => { editor.current?.focus(); editor.current?.setSelectionRange(start + before.length, end + before.length); });
  };
  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    try {
      const JSZip = (await import("jszip")).default;
      const incoming: LatexProject["files"] = [];
      let size = 0;
      for (const input of Array.from(files)) {
        if (input.size > LATEX_LIMIT) throw new Error("Keep uploads smaller than 12 MB.");
        const entries = /\.zip$/i.test(input.name) ? Object.values((await JSZip.loadAsync(await input.arrayBuffer())).files).filter(entry => !entry.dir) : null;
        if (entries && entries.length > 100) throw new Error("Import up to 100 files at a time.");
        const read = async (path: string, bytes: Uint8Array) => {
          if (!validLatexPath(path)) return;
          size += bytes.length; if (size > LATEX_LIMIT) throw new Error("Keep projects smaller than 12 MB.");
          const binary = /\.(png|jpe?g|pdf)$/i.test(path);
          let content = "";
          if (binary) { for (let offset = 0; offset < bytes.length; offset += 8192) content += String.fromCharCode(...bytes.subarray(offset, offset + 8192)); content = btoa(content); }
          else content = new TextDecoder().decode(bytes);
          incoming.push({ path, content, binary });
        };
        if (entries) for (const entry of entries) { const raw = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName || entry.name; if (!validLatexPath(raw)) continue; const expanded = (entry as typeof entry & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0; if (size + expanded > LATEX_LIMIT) throw new Error("Keep the uncompressed project smaller than 12 MB."); await read(raw, await entry.async("uint8array")); }
        else await read(input.name, new Uint8Array(await input.arrayBuffer()));
      }
      if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
        const firstFolder = incoming[0]?.path.split('/')[0];
        if (firstFolder && incoming.every(item => item.path.startsWith(firstFolder + '/'))) incoming.forEach(item => { item.path = item.path.slice(firstFolder.length + 1); });
        const main = incoming.find(item => item.path === 'main.tex') || incoming.find(item => /\.tex$/i.test(item.path) && !item.binary);
        if (!main) throw new Error('The ZIP needs a .tex main document.');
        setPendingImport(validateLatexProject({ name: files[0].name.replace(/\.zip$/i, ''), main: main.path, files: incoming })); setDialog('import'); if (upload.current) upload.current.value = ''; return;
      }
      if (!incoming.length) throw new Error("Choose .tex, .bib, .sty, .cls, image, PDF, or ZIP files.");
      if (incoming.some(item => project.files.some(existing => existing.path.toLowerCase() === item.path.toLowerCase()))) throw new Error("A filename already exists. Rename it before importing to avoid replacing your work.");
      const updated = validateLatexProject({ ...project, files: [...project.files, ...incoming] }); setProject(updated); setActivePath(incoming[0].path);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not import files."); }
    if (upload.current) upload.current.value = "";
  };
  const downloadSource = async () => {
    const JSZip = (await import("jszip")).default; const zip = new JSZip();
    project.files.forEach(item => zip.file(item.path, item.content, { base64: !!item.binary }));
    downloadBlob(await zip.generateAsync({ type: "blob" }), (project.name || "project").replace(/[^\w -]/g, "") + ".zip");
  };
  const submitDialog = () => {
    try {
      if (dialog === "import" && pendingImport) { setProject(pendingImport); setActivePath(pendingImport.main); setPdf(null); setLog(""); setError(""); saveAllowed.current = true; }
      else if (dialog === "templates") { const next = newLatexProject(template); setProject(next); setActivePath(next.main); setPdf(null); setLog(""); setError(""); }
      else if (dialog === "delete") { if (file.path === project.main) throw new Error("Choose another main document before deleting this file."); setProject({ ...project, files: project.files.filter(item => item.path !== file.path) }); setActivePath(project.main); }
      else {
        const path = filename.trim(); if (!validLatexPath(path)) throw new Error("Use a relative filename such as sections/intro.tex.");
        if (project.files.some(item => item.path.toLowerCase() === path.toLowerCase() && (dialog !== "rename" || item.path !== file.path))) throw new Error("That filename already exists.");
        const next = dialog === "rename" ? { ...project, main: project.main === file.path ? path : project.main, files: project.files.map(item => item.path === file.path ? { ...item, path } : item) } : { ...project, files: [...project.files, { path, content: "" }] };
        setProject(validateLatexProject(next)); setActivePath(path);
      }
      setDialog(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update the project."); }
  };

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void compile(); } if ((event.ctrlKey || event.metaKey) && event.key === "s") { event.preventDefault(); void saveLatexProject(project).then(() => setSaveState("Saved on this device")).catch(() => setSaveState("Could not save")); } }}>
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#123d32] px-4 py-3 text-white">
      <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 font-serif text-xl">T<span className="sr-only">LaTeX project</span></span><div><input aria-label="Project name" value={project.name} maxLength={100} onChange={event => setProject({ ...project, name: event.target.value })} className="w-48 max-w-full border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-white/60" /><p className="text-[10px] text-emerald-100/70">Your ideas, beautifully typeset.</p></div></div>
      <div className="flex items-center gap-1"><button type="button" className={buttonClass + " hover:bg-white/10"} onClick={() => setDialog("templates")}><FolderOpen size={14} />Templates</button><button type="button" className={buttonClass + " hover:bg-white/10"} onClick={() => void downloadSource()}><Download size={14} />Source ZIP</button><button type="button" disabled={!pdf} className={buttonClass + " bg-white/10 hover:bg-white/20"} onClick={() => { if (pdf) downloadBlob(new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), (project.name || "document") + ".pdf"); }}><Download size={14} />Download PDF</button></div>
    </div>
    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2"><div className="flex items-center gap-2"><button type="button" aria-label={sidebar ? "Hide file panel" : "Show file panel"} className={buttonClass} onClick={() => setSidebar(!sidebar)}>{sidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button><span className="hidden text-xs text-slate-500 sm:inline">Workspace</span></div><span role="status" className="flex items-center gap-1.5 text-[11px] text-slate-500"><Check size={12} />{saveState}</span></div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800">{error}<button type="button" aria-label="Dismiss error" onClick={() => setError("")}><X size={14} /></button></div>}
    <div className="flex min-h-[700px] min-w-0">
      {sidebar && <aside aria-label="Project files" className="hidden w-52 shrink-0 border-r border-slate-200 bg-slate-50/70 md:block"><div className="flex items-center justify-between px-3 py-3"><h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Files</h2><div className="flex"><button type="button" aria-label="New file" className="rounded p-1.5 text-slate-500 hover:bg-slate-200" onClick={() => { setFilename(""); setDialog("new"); }}><Plus size={14} /></button><button type="button" aria-label="Upload project files" className="rounded p-1.5 text-slate-500 hover:bg-slate-200" onClick={() => upload.current?.click()}><Upload size={14} /></button></div></div>
        <div className="max-h-64 overflow-auto px-2">{project.files.map(item => <button key={item.path} type="button" onClick={() => setActivePath(item.path)} className={"mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs " + (file.path === item.path ? "bg-emerald-100/70 font-medium text-emerald-900" : "text-slate-600 hover:bg-slate-100")}><FileCode2 size={14} className="shrink-0" /><span className="truncate">{item.path}</span>{item.path === project.main && <span className="ml-auto text-[9px] text-emerald-700">main</span>}</button>)}</div>
        <div className="flex justify-end gap-1 border-b border-slate-200 px-3 pb-3"><button type="button" aria-label="Rename file" className={buttonClass} onClick={() => { setFilename(file.path); setDialog("rename"); }}><Pencil size={13} /></button><button type="button" aria-label="Delete file" disabled={file.path === project.main} className={buttonClass} onClick={() => setDialog("delete")}><Trash2 size={13} /></button></div>
        <h2 className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Document outline</h2><nav aria-label="Document outline" className="px-2">{outline.map((item, index) => <button key={index} type="button" onClick={() => jump(item.offset)} className={"block w-full truncate rounded py-2 text-left text-xs text-slate-600 hover:bg-slate-100 " + (item.level === "subsection" ? "pl-6 pr-2" : "px-2")}>{item.title}</button>)}{!outline.length && <p className="px-2 py-2 text-xs text-slate-400">Sections appear here.</p>}</nav>
        <div className="px-3 pt-5"><label className="text-[10px] font-medium text-slate-500">Main document<select aria-label="Main document" value={project.main} onChange={event => setProject({ ...project, main: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700">{project.files.filter(item => /\.tex$/i.test(item.path) && !item.binary).map(item => <option key={item.path}>{item.path}</option>)}</select></label></div>
      </aside>}
      <div className="min-w-0 flex-1"><div className="flex border-b border-slate-200 lg:hidden"><button type="button" className={buttonClass + " flex-1 " + (mobilePane === "source" ? "bg-emerald-50 text-emerald-800" : "")} onClick={() => setMobilePane("source")}>Source</button><button type="button" className={buttonClass + " flex-1 " + (mobilePane === "preview" ? "bg-emerald-50 text-emerald-800" : "")} onClick={() => setMobilePane("preview")}>PDF preview</button><button type="button" aria-label="New file on mobile" className={buttonClass} onClick={() => { setFilename(""); setDialog("new"); }}><Plus size={14} /></button><button type="button" aria-label="Upload files on mobile" className={buttonClass} onClick={() => upload.current?.click()}><Upload size={14} /></button></div>
        <div ref={workspace} className="flex min-h-[650px] min-w-0">
          <section aria-label="LaTeX source editor" style={{ flexBasis: `${split}%` }} className={(mobilePane === "source" ? "flex" : "hidden") + " min-w-0 flex-1 flex-col lg:flex lg:flex-none"}>
            <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-white px-3"><span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600"><FileCode2 size={14} /><span className="hidden truncate md:inline">{file.path}</span><select aria-label="Active project file" value={file.path} onChange={event => setActivePath(event.target.value)} className="max-w-40 bg-transparent text-xs md:hidden">{project.files.map(item => <option key={item.path}>{item.path}</option>)}</select></span><div className="flex items-center"><button type="button" aria-label="Find in source" className={buttonClass} onClick={() => setFind(!find)}><Search size={14} /></button><span className="text-[10px] text-slate-400">Source</span></div></div>
            <div className="flex flex-wrap gap-0.5 border-b border-slate-100 px-2 py-1"><button type="button" className={buttonClass + " font-bold"} onClick={() => insert("\\textbf{", "}")}>B</button><button type="button" className={buttonClass + " font-serif italic"} onClick={() => insert("\\textit{", "}")}>I</button><button type="button" aria-label="Insert equation" className={buttonClass} onClick={() => insert("\n\\begin{equation}\n  ", "\n\\end{equation}\n")}><Braces size={14} /></button><button type="button" className={buttonClass} onClick={() => insert("\n\\section{", "}\n")}>Section</button><button type="button" aria-label="Insert image" className={buttonClass} onClick={() => insert("\n\\includegraphics[width=0.8\\textwidth]{", "}\n")}><ImageIcon size={14} /></button><label className="ml-auto flex items-center gap-1 text-[10px] text-slate-400"><input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} />Auto compile</label></div>
            {find && <div className="flex gap-1 border-b border-slate-200 p-2"><input aria-label="Find text" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 rounded border border-slate-300 px-2 text-xs" placeholder="Find in this file" /><button type="button" className={buttonClass} onClick={() => { if (!query) return; const start = source.indexOf(query, (editor.current?.selectionEnd || 0)); const at = start >= 0 ? start : source.indexOf(query); if (at >= 0) { jump(at); requestAnimationFrame(() => editor.current?.setSelectionRange(at, at + query.length)); } else setError("No matching text in this file."); }}>Next</button><button type="button" aria-label="Close find" className={buttonClass} onClick={() => setFind(false)}><X size={13} /></button></div>}
            {file.binary ? <div className="grid flex-1 place-items-center px-6 text-center text-sm text-slate-500"><div><ImageIcon className="mx-auto mb-3" />{file.path}<p className="mt-2 text-xs">Asset included in your project.</p></div></div> : <div className="relative flex min-h-[520px] flex-1 overflow-hidden bg-[#fcfcfd]"><div ref={lineNumbers} aria-hidden="true" className="max-h-[600px] w-11 shrink-0 overflow-hidden border-r border-slate-100 bg-slate-50/50 py-4 text-right font-mono text-[12px] leading-6 text-slate-300"><div className="pr-3">{source.split("\n").map((_, index) => <div key={index}>{index + 1}</div>)}</div></div><div className="relative min-w-0 flex-1"><pre ref={highlight} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre p-4 font-mono text-[12px] leading-6 text-[#244e63]">{source.split(/(%[^\n]*|\\[a-zA-Z@]+\*?|[{}$])/g).map((token, index) => <span key={index} className={token.startsWith("%") ? "text-emerald-600" : token.startsWith("\\") ? "text-blue-700" : /^[{}$]$/.test(token) ? "text-amber-700" : undefined}>{token}</span>)}{"\n"}</pre><textarea ref={editor} aria-label="LaTeX source" value={source} spellCheck={false} wrap="off" onChange={event => updateSource(event.target.value)} onSelect={event => { const start = event.currentTarget.selectionStart; const parts = source.slice(0, start).split("\n"); setCursor({ line: parts.length, column: parts[parts.length - 1].length + 1 }); }} onScroll={event => { if (lineNumbers.current) lineNumbers.current.scrollTop = event.currentTarget.scrollTop; if (highlight.current) { highlight.current.scrollTop = event.currentTarget.scrollTop; highlight.current.scrollLeft = event.currentTarget.scrollLeft; } }} onKeyDown={event => { if (event.key === "Tab") { event.preventDefault(); insert("  "); } }} className="max-h-[600px] min-h-[520px] w-full flex-1 resize-none border-0 bg-transparent p-4 font-mono text-[12px] leading-6 text-transparent caret-slate-800 outline-none selection:bg-emerald-200/50" /></div></div>}
            <div className="flex justify-between border-t border-slate-200 px-3 py-2 text-[10px] text-slate-400"><span>Ln {cursor.line}, Col {cursor.column}</span><span>LaTeX · UTF-8 · {source.trim().split(/\s+/).filter(Boolean).length} words</span></div>
          </section>
          <div role="separator" aria-label="Resize editor and preview" aria-orientation="vertical" aria-valuenow={split} tabIndex={0} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setSplit(previous => Math.max(28, Math.min(72, previous + (event.key === "ArrowLeft" ? -3 : 3)))); } }} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId) || !workspace.current) return; const bounds = workspace.current.getBoundingClientRect(); setSplit(Math.max(28, Math.min(72, (event.clientX - bounds.left) / bounds.width * 100))); }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)} className="hidden w-1.5 shrink-0 cursor-col-resize bg-slate-200/70 hover:bg-emerald-300 lg:block" />
          <section aria-label="PDF preview" className={(mobilePane === "preview" ? "flex" : "hidden") + " min-w-0 flex-1 flex-col bg-[#e9edec] lg:flex"}>
            <div className="flex h-11 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3"><div className="flex items-center gap-1.5"><button type="button" disabled={!ready} onClick={() => busy ? engine.current?.stop() : void compile()} className="inline-flex h-8 items-center gap-2 rounded-md bg-[#22744d] px-3 text-xs font-semibold text-white hover:bg-[#195c3c] disabled:opacity-40">{busy ? <Square size={12} /> : <Play size={12} fill="currentColor" />}{busy ? "Stop" : "Recompile"}</button><span className="hidden text-[10px] text-slate-400 xl:inline">Ctrl + Enter</span></div><button type="button" onClick={() => setShowLog(!showLog)} className={buttonClass + (showLog ? " bg-slate-100" : "")}><FileText size={13} />Logs<ChevronDown size={12} /></button></div>
            <div role="status" className="flex min-h-8 items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2 text-[10px] text-slate-500"><span className="flex items-center gap-1.5">{busy && <LoaderCircle size={12} className="animate-spin" />}{busy ? phase : stale ? "Source changed · recompile to update the PDF" : pdf ? "PDF is up to date" : "Ready when you are"}</span><span>pdfLaTeX</span></div>
            <LatexPdfPreview bytes={pdf} />
            {showLog && <div className="border-t border-slate-300 bg-[#17252b] text-slate-200"><div className="flex items-center justify-between px-3 py-2 text-[11px]"><span>Compilation log</span><button type="button" aria-label="Close compilation log" onClick={() => setShowLog(false)}><X size={13} /></button></div><pre className="max-h-48 overflow-auto whitespace-pre-wrap px-3 pb-3 font-mono text-[10px] leading-5">{log || "Compile your document to see the log."}</pre></div>}
          </section>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2.5 text-[10px] text-slate-400"><span>Compiled on your device · TeX packages downloaded on demand</span><a className="hover:text-slate-700" href="/vendor/swiftlatex/NOTICE.txt" target="_blank" rel="noreferrer">Compiler &amp; licenses</a></div>
    <input ref={upload} aria-label="Import LaTeX files" type="file" multiple accept=".tex,.bib,.sty,.cls,.bst,.txt,.png,.jpg,.jpeg,.pdf,.zip" className="hidden" onChange={event => void importFiles(event.target.files)} />
    <dialog ref={dialogRef} aria-labelledby="latex-dialog-title" onCancel={() => setDialog(null)} className="m-auto w-[min(92vw,440px)] rounded-xl border border-slate-200 p-6 shadow-2xl backdrop:bg-slate-950/40"><form onSubmit={event => { event.preventDefault(); submitDialog(); }}><h2 id="latex-dialog-title" className="text-lg font-semibold text-slate-900">{dialog === "import" ? "Import project" : dialog === "templates" ? "Start a new project" : dialog === "delete" ? "Delete file?" : dialog === "rename" ? "Rename file" : "New file"}</h2>{dialog === "import" ? <p className="mt-3 text-sm text-slate-600">Import {pendingImport?.name} ({pendingImport?.files.length} files)? This replaces the current workspace. Download its source ZIP first to keep it.</p> : dialog === "templates" ? <><p className="mt-2 text-sm text-slate-500">This replaces the current project. Download its source ZIP first if you want to keep it.</p><label className="mt-5 block text-xs font-medium">Template<select aria-label="Project template" value={template} onChange={event => setTemplate(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 p-2.5 text-sm">{Object.entries(LATEX_TEMPLATES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label></> : dialog === "delete" ? <p className="mt-3 text-sm text-slate-600">Remove {file.path} from this project?</p> : <label className="mt-4 block text-xs font-medium">Filename<input autoFocus aria-label="Filename" value={filename} onChange={event => setFilename(event.target.value)} placeholder="sections/intro.tex" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></label>}{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" className={buttonClass} onClick={() => { setDialog(null); setError(""); }}>Cancel</button><button type="submit" className="rounded-md bg-[#22744d] px-4 py-2 text-xs font-semibold text-white">{(dialog === "templates" || dialog === "import") ? "Replace project" : dialog === "delete" ? "Delete file" : "Save"}</button></div></form></dialog>
  </div>;
}

function LatexPdfPreview({ bytes }: { bytes: Uint8Array | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1), [total, setTotal] = useState(0), [zoom, setZoom] = useState(100), [error, setError] = useState("");
  useEffect(() => {
    if (!bytes) return;
    let cancelled = false; let task: import("pdfjs-dist").PDFDocumentLoadingTask | undefined; let render: import("pdfjs-dist").RenderTask | undefined;
    void (async () => {
      try {
        const pdfjs = await getPdfJs(); if (cancelled) return;
        task = pdfjs.getDocument({ data: new Uint8Array(bytes) }); const doc = await task.promise;
        if (cancelled) return;
        setTotal(doc.numPages); const number = Math.min(page, doc.numPages); if (number !== page) setPage(number);
        const pdfPage = await doc.getPage(number); if (cancelled || !canvas.current) return;
        const viewport = pdfPage.getViewport({ scale: 1.5 * zoom / 100 }); const target = document.createElement("canvas"); target.width = viewport.width; target.height = viewport.height;
        const context = target.getContext("2d"); if (!context) throw new Error("PDF canvas is unavailable.");
        render = pdfPage.render({ canvas: target, canvasContext: context, viewport }); await render.promise;
        if (cancelled || !canvas.current) return;
        canvas.current.width = target.width; canvas.current.height = target.height; canvas.current.getContext("2d")?.drawImage(target, 0, 0); setError("");
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : "Preview unavailable."); }
    })();
    return () => { cancelled = true; render?.cancel(); void task?.destroy(); };
  }, [bytes, page, zoom]);
  if (!bytes) return <div className="grid min-h-[520px] flex-1 place-items-center p-8 text-center"><div className="max-w-56"><div className="mx-auto mb-5 grid h-16 w-14 place-items-center rounded-lg border border-slate-300 bg-white text-emerald-700 shadow-sm"><FileText size={28} strokeWidth={1.3} /></div><h3 className="font-serif text-xl text-slate-600">Bring your words to life.</h3><p className="mt-3 text-xs leading-6 text-slate-500">Your typeset PDF appears here.<br />Click Recompile to get started.</p></div></div>;
  return <><div className="flex h-10 items-center justify-center gap-1 border-b border-slate-300/50 text-slate-600"><button type="button" aria-label="Previous PDF page" disabled={page <= 1} className={buttonClass} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button><span className="min-w-20 text-center text-[11px]">{page} / {total || "…"}</span><button type="button" aria-label="Next PDF page" disabled={page >= total} className={buttonClass} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button><span className="mx-2 h-4 border-l border-slate-300" /><button type="button" aria-label="Zoom out" className={buttonClass} disabled={zoom <= 50} onClick={() => setZoom(zoom - 10)}><ZoomOut size={14} /></button><span className="text-[11px]">{zoom}%</span><button type="button" aria-label="Zoom in" className={buttonClass} disabled={zoom >= 180} onClick={() => setZoom(zoom + 10)}><ZoomIn size={14} /></button></div><div className="max-h-[620px] min-h-[480px] flex-1 overflow-auto p-5">{error && <p role="alert" className="mb-3 text-xs text-red-700">{error}</p>}<canvas ref={canvas} aria-label={"Compiled PDF page " + page} className="mx-auto h-auto max-w-none bg-white shadow-md" style={{ width: `${zoom}%` }} /></div></>;
}
