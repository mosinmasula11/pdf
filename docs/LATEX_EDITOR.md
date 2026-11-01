# LaTeX editor

Available at `/latex-editor`, in Utilities and the Developer tools menu.

## Included

- Split source/PDF workspace, adjustable divider, syntax coloring, line numbers, source search, and section outline.
- File creation, rename, removal, nested paths, main-document selection, and source/image uploads.
- Article, report, letter, and blank templates.
- Real pdfLaTeX compilation in an isolated Web Worker, two passes for references and table-of-contents updates, stop control, optional automatic recompilation, logs, and a 90-second limit per pass.
- PDF.js page preview with page navigation and zoom. The last successful PDF remains available if compilation fails.
- PDF download and complete source ZIP download. ZIP project import asks before replacing the workspace.
- Automatic IndexedDB saving on the current device; Ctrl+S saves explicitly and Ctrl+Enter compiles.

## Hosting

No operating-system TeX installation is required. The unmodified SwiftLaTeX v20022022 pdfTeX worker and WebAssembly assets are included in `public/vendor/swiftlatex/`. Preserve the license and source notices in that directory when distributing the tool.

The Next.js `/api/latex-packages/[...path]` route downloads only TeX resources from the fixed TeXlyre mirror at `https://texlive.texlyre.org`. Document bodies are compiled on the user's device. The hosting environment needs outbound HTTPS access to that mirror. The first compile downloads the format, classes, fonts, and packages; subsequent requests use browser caching and a bounded server memory cache. Package requests reject arbitrary hosts, traversal, redirects, and oversized resources.

Projects are limited to 100 files and 12 MB of stored source/asset data. Compressed uploads are checked against the expanded project budget. IndexedDB quota or access failures are visible in the save status; source ZIPs provide a separate backup.

## Scope

This is an Overleaf-style single-user workspace, not an Overleaf service integration. It uses the SwiftLaTeX pdfTeX/TeX Live 2020 engine and compatible packages. XeLaTeX/LuaLaTeX, cloud accounts, project history, real-time collaboration, SyncTeX, and shell escape are not included. Package downloads require network access. Source and PDF files can be exported to continue in another TeX environment.

## Verification

- 23 unit tests cover project paths, size/count limits, duplicate files, templates, outlines, and fixed-host package downloads.
- Browser-tested real article and multifile compilation, PDF canvas rendering, invalid-command diagnostics, ZIP import/export, and persistence after reload.
- Downloaded PDF text was checked for the equation section and included source-file content; ZIP contents were checked for both source files.
- TypeScript, targeted lint, and the production build were checked.
