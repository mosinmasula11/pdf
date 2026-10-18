import {
  AppWindow,
  Archive,
  Binary,
  Braces,
  Camera,
  Clock,
  Code2,
  Crop,
  Edit3,
  EyeOff,
  FileCheck,
  FileCode,
  FileImage,
  FileOutput,
  FileSpreadsheet,
  FileStack,
  FileText,
  FormInput,
  GitCompare,
  Hash,
  ImageDown,
  Images,
  Key,
  KeyRound,
  Languages,
  LayoutGrid,
  Link2,
  Lock,
  Maximize,
  Minimize2,
  PenSquare,
  Presentation,
  QrCode,
  RefreshCw,
  RotateCw,
  ScanText,
  Scissors,
  Send,
  ShieldCheck,
  Signature,
  Sparkles,
  Stamp,
  Tags,
  Trash2,
  Type,
  Unlock,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const toolIcons: Record<string, LucideIcon> = {
  // Organize PDF
  "merge-pdf": FileStack,
  "split-pdf": Scissors,
  "remove-pages": Trash2,
  "extract-pages": FileOutput,
  "organize-pdf": LayoutGrid,
  "scan-pdf": Camera,

  // Optimize PDF
  "compress-pdf": Minimize2,
  "repair-pdf": Wrench,
  "ocr-pdf": ScanText,

  // Convert to PDF
  "jpg-to-pdf": Images,
  "word-to-pdf": FileText,
  "powerpoint-to-pdf": Presentation,
  "excel-to-pdf": FileSpreadsheet,
  "html-to-pdf": Code2,

  // Convert from PDF
  "pdf-to-jpg": ImageDown,
  "pdf-to-word": FileText,
  "pdf-to-powerpoint": Presentation,
  "pdf-to-excel": FileSpreadsheet,
  "convert-pdf-to-pdfa": Archive,

  // Edit PDF
  "rotate-pdf": RotateCw,
  "add-page-numbers": Hash,
  "add-watermark": Stamp,
  "crop-pdf": Crop,
  "edit-pdf": Edit3,
  "pdf-forms": FormInput,
  "flatten-pdf": FileCheck,

  // PDF Security
  "unlock-pdf": Unlock,
  "protect-pdf": Lock,
  "sign-pdf": Signature,
  "redact-pdf": EyeOff,
  "compare-pdf": GitCompare,
  "pdf-metadata-editor": Tags,

  // PDF Intelligence
  "pdf-summarize": Sparkles,
  "translate-pdf": Languages,
  "pdf-to-markdown": FileCode,

  // Image Tools
  "compress-image": FileImage,
  "resize-image-to-custom-kb": Maximize,
  "resize-image": Maximize,
  "pass-photo-maker": UserRound,
  "signature-resizer": Signature,
  "webp-to-jpg": FileImage,
  "image-to-ico": AppWindow,
  "svg-to-png": FileCode,
  "image-converter": RefreshCw,

  // Utilities
  "word-counter": FileText,
  "json-formatter": Braces,
  "qr-code-generator": QrCode,
  "case-converter": Type,
  "base64-converter": Binary,
  "password-generator": KeyRound,
  "api-client": Send,
  "api-key-generator": Key,
  "jwt-debugger": ShieldCheck,
  "epoch-converter": Clock,
  "url-converter": Link2,
};

export function getToolIcon(id: string): LucideIcon {
  return toolIcons[id] ?? FileOutput;
}

