import {
  Archive,
  Braces,
  Camera,
  Code2,
  Crop,
  Edit3,
  EyeOff,
  FileArchive,
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
  Languages,
  LayoutGrid,
  Lock,
  Maximize,
  Minimize2,
  PenSquare,
  Presentation,
  RotateCw,
  ScanText,
  Scissors,
  Signature,
  Sparkles,
  Stamp,
  Trash2,
  Unlock,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ToolDefinition } from "@/lib/tool-registry";

const toolIcons: Record<string, LucideIcon> = {
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

  // PDF Security
  "unlock-pdf": Unlock,
  "protect-pdf": Lock,
  "sign-pdf": PenSquare,
  "redact-pdf": EyeOff,
  "compare-pdf": GitCompare,

  // PDF Intelligence
  "pdf-summarize": Sparkles,
  "translate-pdf": Languages,
  "pdf-to-markdown": FileCode,

  // Images
  "compress-image": FileImage,
  "resize-image-to-custom-kb": Maximize,
  "resize-image": Maximize,
  "pass-photo-maker": UserRound,
  "signature-resizer": Signature,

  // Utilities
  "word-counter": FileText,
  "json-formatter": Braces,
};

const categoryStyles: Record<ToolDefinition["category"], string> = {
  "PDF Tools": "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
  "Image Tools": "bg-sky-50 text-sky-600 group-hover:bg-sky-100",
  Utilities: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
};

export function ToolGridCard({
  tool,
}: { tool: ToolDefinition }) {
  const Icon = toolIcons[tool.id] ?? FileOutput;

  return (
    <Link
      href={tool.path}
      className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition ${categoryStyles[tool.category]}`}
      >
        <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 font-semibold leading-5 text-slate-900">
          {tool.name}
          {tool.status === "beta" && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Beta
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-4 text-slate-500 line-clamp-2">
          {tool.description}
        </span>
      </span>
    </Link>
  );
}
