export type ToolCategory = "PDF Tools" | "Image Tools" | "Utilities";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  path: string;
  supportedFormats: string[];
  seoTitle: string;
  metaDescription: string;
  status: "working" | "beta" | "planned";
};

export const toolRegistry: ToolDefinition[] = [
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Convert JPG and PNG images into a single PDF document.",
    category: "PDF Tools",
    path: "/jpg-to-pdf",
    supportedFormats: ["JPG", "PNG"],
    seoTitle: "JPG to PDF Converter | Free Online",
    metaDescription: "Convert JPG, PNG and other image files to PDF in your browser without uploading them.",
    status: "working",
  },
  {
    id: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one organized document.",
    category: "PDF Tools",
    path: "/merge-pdf",
    supportedFormats: ["PDF"],
    seoTitle: "Merge PDF Files | Free Online",
    metaDescription: "Merge PDF files together in the browser and download the final document instantly.",
    status: "working",
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    description: "Extract a selected page range from a PDF into a new file.",
    category: "PDF Tools",
    path: "/split-pdf",
    supportedFormats: ["PDF"],
    seoTitle: "Split PDF | Free Online",
    metaDescription: "Split a PDF by page range in a browser and save the extracted pages as a new document.",
    status: "working",
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    description: "Turn pages by 90 degrees to fix orientation issues.",
    category: "PDF Tools",
    path: "/rotate-pdf",
    supportedFormats: ["PDF"],
    seoTitle: "Rotate PDF | Free Online",
    metaDescription: "Rotate PDF pages in your browser to fix portrait or landscape orientation in seconds.",
    status: "working",
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Extract pages from a PDF as JPG images for easy sharing.",
    category: "PDF Tools",
    path: "/pdf-to-jpg",
    supportedFormats: ["PDF"],
    seoTitle: "PDF to JPG Converter | Free Online",
    metaDescription: "Turn each PDF page into a JPG image locally in your browser with no uploads.",
    status: "working",
  },
  {
    id: "compress-image",
    name: "Compress Image",
    description: "Reduce image size while keeping a sharp, useful result.",
    category: "Image Tools",
    path: "/compress-image",
    supportedFormats: ["JPG", "PNG", "WEBP"],
    seoTitle: "Compress Image Online | Free File Reducer",
    metaDescription: "Reduce JPG, PNG and WebP file sizes locally in your browser for faster uploads and sharing.",
    status: "working",
  },
  {
    id: "resize-image-to-custom-kb",
    name: "Resize Image to Custom KB",
    description: "Target a precise file size for forms, government portals and student applications.",
    category: "Image Tools",
    path: "/resize-image-to-custom-kb",
    supportedFormats: ["JPG", "PNG", "WEBP"],
    seoTitle: "Resize Image to Custom KB | Free Online",
    metaDescription: "Reduce an image to an exact target size such as 20KB or 100KB without leaving the browser.",
    status: "working",
  },
  {
    id: "resize-image",
    name: "Resize Image",
    description: "Change image dimensions by pixels or percentage.",
    category: "Image Tools",
    path: "/resize-image",
    supportedFormats: ["JPG", "PNG", "WEBP"],
    seoTitle: "Resize Image | Free Online",
    metaDescription: "Resize images in your browser to exact pixel dimensions or percentage values quickly and securely.",
    status: "working",
  },
  {
    id: "pass-photo-maker",
    name: "Passport Photo Maker",
    description: "Create print-ready images for ID and document applications.",
    category: "Image Tools",
    path: "/passport-photo-maker",
    supportedFormats: ["JPG", "PNG", "PDF"],
    seoTitle: "Passport Photo Maker | Free Online",
    metaDescription: "Create passport-style prints and document-ready photo layouts without exposing files online.",
    status: "beta",
  },
  {
    id: "signature-resizer",
    name: "Signature Resizer",
    description: "Trim and resize signature images for portal and form uploads.",
    category: "Image Tools",
    path: "/signature-resizer",
    supportedFormats: ["JPG", "PNG", "WEBP"],
    seoTitle: "Signature Resizer | Free Online",
    metaDescription: "Crop and resize signature images to precise requirements with local browser processing.",
    status: "beta",
  },
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Count words, characters and reading time instantly.",
    category: "Utilities",
    path: "/word-counter",
    supportedFormats: ["Text"],
    seoTitle: "Word Counter Online | Free Tool",
    metaDescription: "Analyze text in real time and count words, characters, sentences and reading time online.",
    status: "working",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate and minify JSON data.",
    category: "Utilities",
    path: "/json-formatter",
    supportedFormats: ["JSON"],
    seoTitle: "JSON Formatter Online | Free Validator",
    metaDescription: "Pretty print, validate and minify JSON directly in your browser.",
    status: "working",
  },
];

export const featuredTools = toolRegistry.slice(0, 5);

export const groupedTools = toolRegistry.reduce<Record<string, ToolDefinition[]>>((acc, tool) => {
  acc[tool.category] ??= [];
  acc[tool.category].push(tool);
  return acc;
}, {});
