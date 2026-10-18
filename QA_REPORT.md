# Tool testing and repairs — 18 October 2026

## Result

All 47 advertised tool pages were checked in the in-app browser. The remaining primary workflows were exercised using synthetic PDFs, a form PDF, an image-only scanned invoice, images including WebP, and basic Office/CSV fixtures. Confirmed defects were repaired and retested. This is a basic functional audit, not certification of every input format or option.

## Repairs completed

- Protect PDF now uses real AES-256 encryption. A downloaded file rejects missing/wrong passwords and opens with the correct password. Permission bits are covered by automated tests.
- Unlock PDF now authenticates and uses the supplied password. Downloaded output opens without encryption and retains three pages.
- Redaction creates a new image-based document after overwriting masked pixels. The downloaded three-page result has no extractable original text or copied original streams/attachments. The UI explains the loss of selectable text/forms/links.
- Editor/redaction previews no longer compete for the same canvas. Errors are visible. Scaled redaction coordinates match the displayed page.
- PDF editor retains annotations while navigating between pages and includes all edited pages in the output. The downloaded result contains rendered edits on both tested pages.
- PDF compression keeps the original when recompression would be larger. The 1.5 KB sample now stays 1.5 KB, rather than growing to 30 KB.
- OCR now recognizes scanned English text using a locally hosted engine and model. The downloaded searchable invoice retains its 600 × 400 point page and contains recognized selectable text.
- QR generation uses a standard encoder, a four-module quiet zone and Blob downloads. Independent decoding of the exported PNG returned the exact test URL. Automated decoding also covers Unicode, WiFi and long payloads.
- Translate PDF requires explicit opt-in before sending extracted text to MyMemory, supports source-language selection, handles the entire text in byte-limited chunks, and reports service errors instead of faking a translation. The privacy policy and homepage disclose the exception. English-to-Spanish translation was verified after opting in.
- PDF/A preparation now rebuilds opaque image pages and embeds actual sRGB output intent, IDs and synchronized metadata. Downloaded outputs identify PDF/A-1b and PDF/A-2b correctly. The UI no longer claims independent conformance validation.
- Passport Photo Maker now crops existing images, exports exact pixel dimensions and creates 4 × 6 inch print sheets. Downloaded output measured 413 × 531 pixels; print sheet measured 288 × 432 PDF points.
- Signature Resizer now trims whitespace, fits without stretching, and exports images with optional size limits. Downloaded output measured 300 × 100 pixels.
- Metadata wiping removes both the Info dictionary and XMP metadata. Independently inspected downloaded output contains neither.
- Spreadsheet conversion now reads inline/shared XLSX strings, preserves sparse column positions, parses quoted/multiline CSV fields and paginates wide/long tables instead of silently truncating cells or columns. Downloaded output retained the long sample cell and columns 11–12.
- Repair PDF now recovers the tested truncated PDF using the maintained parser. Unrecoverable files still produce an error.
- Blank drawn signatures are rejected; signature coordinates respect the displayed scale. Camera preview setup now runs after its video element mounts.
- Legacy DOC/PPT/XLS inputs are rejected explicitly. Text/image-only conversion limitations are stated instead of presenting placeholder output as a faithful Office conversion. Comparison and summarization descriptions state their actual text-based behavior.
- Production builds use Next.js's supported Webpack fallback and documented Tailwind PostCSS integration after the original Turbopack stylesheet process crashed. The manifest icon type was corrected.

## Every-tool coverage

“UI pass” means the sample produced the expected result/download control. “File verified” means exported bytes were independently inspected too.

| Tool | Coverage and outcome |
|---|---|
| Merge PDF | UI pass: two PDFs processed and download control appeared. |
| Split PDF | UI pass: range-processing result/download appeared. |
| Remove Pages | UI pass: page 2 selected for removal and result created. |
| Extract Pages | UI pass: selected first page extracted. |
| Organize PDF | UI pass: document saved with default order; every reorder combination not covered. |
| Scan to PDF | UI pass: photo upload, page creation and PDF export. Physical camera access not tested. |
| Compress PDF | Fixed and retested: smaller original retained, before/after both 1.5 KB. |
| Repair PDF | Fixed and retested with a truncated three-page input; recovery output control appeared. |
| OCR PDF | File verified: image-only scan recognized; searchable text and original page dimensions retained. English model only. |
| JPG to PDF | UI pass: PNG image converted, PDF output created. |
| WORD to PDF | UI pass: DOCX text exported. Original page layout/images are not preserved; legacy DOC explicitly unsupported. |
| POWERPOINT to PDF | UI pass: PPTX slide text exported. Original artwork/layout/animation not preserved; legacy PPT unsupported. |
| EXCEL to PDF | File verified: CSV, quoted/multiline CSV and sparse/inline-string XLSX tested; wide columns retained. First worksheet values only. |
| HTML to PDF | File verified: long static HTML exported to two pages. External resources/scripts excluded. URL mode requires a CORS-enabled website. |
| PDF to JPG | UI pass: three pages processed and ZIP output created. |
| PDF to WORD | UI pass: three-page text extraction to DOCX; layout/images not preserved. |
| PDF to POWERPOINT | UI pass: three page-image slides created; elements within slides are not separately editable. |
| PDF to EXCEL | UI pass: expected sample table rows displayed and XLSX/CSV controls appeared. Complex table reconstruction not certified. |
| PDF to PDF/A | File verified: output intents, IDs, page counts, headers and correct part 1/2 metadata. Independent veraPDF validation remains outstanding. |
| Rotate PDF | File verified: all three pages have 90-degree rotation in exported output. |
| Add Page Numbers | UI pass: numbered output created. |
| Add Watermark | UI pass: default text watermark output created. Logo watermark variants not exhaustively tested. |
| Crop PDF | UI pass: default margin crop output created. |
| Edit PDF | File verified: page-one annotation restored after navigation, and edited images exported on both tested pages. |
| PDF Forms | UI pass: synthetic text field changed and filled output created. |
| Flatten PDF | UI pass: interactive form input produced flattened output control. All annotation types not certified. |
| Unlock PDF | File verified: correct-password decryption retained three pages; wrong-password rejection covered by automated test. |
| Protect PDF | File verified: real encryption, missing/wrong password rejection, correct-password access; permission bits covered by tests. |
| Sign PDF | UI pass: typed synthetic signature exported. Empty-drawing validation added. |
| Redact PDF | File verified: three-page rebuilt output contains no extractable original text. |
| Compare PDF | UI pass: identical files reported zero additions/removals. Text comparison only; visual differences not detected. |
| PDF Metadata Editor | File verified: standard properties saved, privacy-mode output has no Info or XMP dictionary. |
| PDF Summarizer | UI pass: overview, topics, counts and report output. Local sentence ranking, not generative AI. |
| Translate PDF | UI pass: opt-in required, English-to-Spanish result produced; full Unicode chunk coverage tested automatically. External service availability/quotas apply. |
| PDF to Markdown | UI pass: conversion produced raw/preview and download controls. |
| Compress Image | UI pass: 1.3 MB input reduced to about 97 KB. |
| Resize Image to Custom KB | UI pass: 100 KB target produced about 96 KB. Output is a maximum-size target, not byte-exact padding. |
| Resize Image | UI pass: image read and resized/exported; all dimensions/formats not exhaustively covered. |
| Passport Photo Maker | File verified: 413 × 531 JPG and correctly sized 4 × 6 inch print PDF. Existing background preserved. |
| Signature Resizer | File verified: 300 × 100 JPG output with whitespace trimming enabled. |
| WebP to JPG / PNG | UI pass: both PNG input and actual WebP input converted to JPG with result/download controls. |
| Word Counter | UI pass: expected words, characters, paragraphs and sentence counts. |
| JSON Formatter | UI pass: formatting, minification and invalid-input feedback. |
| QR Code Generator | File verified: exported PNG independently decoded; additional payloads covered by regression tests. |
| Text Case Converter | UI pass: all ten case modes matched expected results. |
| Base64 Encoder & Decoder | UI pass: Hindi/emoji round trip, file data URL and invalid-input rejection. |
| Password Generator | UI pass: random password, PIN, passphrase and ten-item bulk list. |

## Automated checks

- Nine regression tests pass: password authentication/permissions, four QR decoder round trips, complete Unicode translation chunking, Info/XMP wiping, CSV/sparse-column parsing, and wide-table pagination.
- TypeScript check passes.
- Targeted lint of repaired tools and helpers has no errors; three existing scanner warnings remain (unused declarations and the local image-preview recommendation).
- Production build passes with Webpack; all 63 generated routes completed in the successful build. The final rebuild, including the last spreadsheet changes, also passed.

The optional browser smoke test of the separately started production server could not complete: the browser timed out connecting to its temporary port and then blocked inspection of the generated error page. The production build itself passed; functional browser results above came from the development app. The temporary production server was stopped.

## Remaining limits

Camera hardware/permission behavior, mobile touch interactions, exhaustive malformed-file recovery, complex Office layout fidelity, and independent PDF/A conformance validation were not certified. OCR currently includes English recognition data. Translation requires network access and shares extracted text only after opt-in. Tests used synthetic documents, not personal files. No deployment was performed.
