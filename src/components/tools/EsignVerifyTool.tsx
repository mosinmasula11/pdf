"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  LoaderCircle,
  X,
  CheckCircle2,
  Download,
  FileCheck2,
  Check,
  Unlock,
  KeyRound,
} from "lucide-react";
import type { SignatureResult } from "@/lib/pdf-signature-check";
import { hasIntactOriginal } from "@/lib/signature-result";
import { downloadBlob } from "@/lib/browser-utils";
import type { PdfVerificationEvidence } from "@/lib/pdf-verification-evidence";
import { EsignPdfPreview } from "./EsignPdfPreview";

interface ServerVerificationResult {
  verified: boolean;
  chainTrusted: boolean;
  signerName: string;
  signingTime: string | null;
  error: string | null;
}

type Job = {
  file: File;
  status: "checking" | "password" | "done" | "error";
  results?: SignatureResult[];
  message?: string;
  evidence?: PdfVerificationEvidence;
  previewPassword?: string;
  serverVerification?: ServerVerificationResult;
};

function FileResult({
  job,
  onRetry,
}: {
  job: Job;
  onRetry: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState("");
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyConsent, setCopyConsent] = useState(false);
  const [copyProgress, setCopyProgress] = useState("");
  const [copyError, setCopyError] = useState("");
  const [unlockPassword, setUnlockPassword] = useState(job.previewPassword || "");
  const [needsPasswordInput, setNeedsPasswordInput] = useState(false);

  useEffect(() => {
    if (job.previewPassword) {
      setUnlockPassword(job.previewPassword);
    }
  }, [job.previewPassword]);

  const downloadVerifiedPdf = async (customPassword?: string) => {
    if (!job.file) return;
    const effectivePassword = (
      (typeof customPassword === "string" && customPassword.length > 0
        ? customPassword
        : unlockPassword || job.previewPassword || "")
    ).trim();
    setCopyBusy(true);
    setCopyError("");
    try {
      const { buildVerificationCopy } = await import("@/lib/pdf-verification-copy");
      const evidence = job.evidence || {
        fileName: job.file.name,
        fileSize: job.file.size,
        sha256: "",
        checkedAt: new Date().toISOString(),
        results: job.results || [
          {
            name: job.serverVerification?.signerName || "Signer",
            integrity: "intact",
            coverage: true,
            trust: "not-verified",
            certificate: "current",
            detail: "Cryptographically verified",
          },
        ],
      };
      const bytes = await buildVerificationCopy(
        job.file,
        evidence,
        effectivePassword,
        (page, total) => setCopyProgress(`Preparing unlocked verified PDF (page ${page} / ${total})...`),
        {
          signerName: job.serverVerification?.signerName,
          signingTime: job.serverVerification?.signingTime,
        }
      );
      downloadBlob(
        new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        job.file.name.replace(/\.pdf$/i, "") + "-verified.pdf"
      );
      setNeedsPasswordInput(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "The verified PDF could not be created.";
      setCopyError(msg);
      if (
        !effectivePassword &&
        (msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("encrypted") ||
          msg.toLowerCase().includes("decrypt"))
      ) {
        setNeedsPasswordInput(true);
      }
    } finally {
      setCopyBusy(false);
      setCopyProgress("");
    }
  };

  const isServerVerified = job.serverVerification?.verified === true;
  const isServerTampered = job.serverVerification?.verified === false;
  const localPassed = job.status === "done" && hasIntactOriginal(job.results);
  const passed = isServerVerified || localPassed;

  const downloadReport = async () => {
    if (!job.evidence) return;
    setReportBusy(true);
    setReportError("");
    try {
      const { buildVerificationReport } = await import("@/lib/pdf-verification-report");
      const bytes = await buildVerificationReport(job.evidence);
      downloadBlob(
        new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        job.file.name.replace(/\.pdf$/i, "") + "-msyn-verification-report.pdf"
      );
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "The report could not be created.");
    } finally {
      setReportBusy(false);
    }
  };

  return (
    <div className="border-t border-amber-200 dark:border-amber-900/50 pt-4 mt-4 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-slate-900 dark:text-white break-words text-sm sm:text-base">
          {job.file.name}
        </p>
        {passed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Verified</span>
          </span>
        )}
      </div>

      {/* Prominent Right Green Tick Badge when verified */}
      {passed && (
        <div
          role="status"
          className="mt-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-950 dark:text-emerald-100 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-900/60">
              <CheckCircle2 aria-hidden="true" className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base text-emerald-950 dark:text-emerald-200">
                  Digital Signature Validated & Verified
                </h3>
                {job.serverVerification?.chainTrusted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200/90 dark:bg-emerald-900/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    <span>CCA India 2022 Root Trusted</span>
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-emerald-850 dark:text-emerald-300 leading-relaxed">
                Signed document bytes are cryptographically intact. No alterations or tampering occurred after signing.
              </p>

              {/* Signer information card */}
              {job.serverVerification?.signerName && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Digital Signer:</span>
                    <strong className="text-slate-900 dark:text-white font-bold break-words">
                      {job.serverVerification.signerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Certificate Authority Trust:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{job.serverVerification.chainTrusted ? "Controller of Certifying Authorities (CCA India)" : "Valid Digital Certificate"}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Download Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={copyBusy}
                  onClick={() => void downloadVerifiedPdf(unlockPassword || job.previewPassword)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900 disabled:opacity-50 cursor-pointer"
                >
                  {copyBusy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                  )}
                  <span>{copyBusy ? copyProgress || "Preparing verified PDF..." : "Download Verified PDF"}</span>
                  <Download className="h-4 w-4 ml-0.5 opacity-90" />
                </button>

                <button
                  type="button"
                  onClick={() => downloadBlob(job.file, job.file.name)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
                >
                  <Download aria-hidden="true" className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Download Original (Unchanged)</span>
                </button>
              </div>

              {needsPasswordInput && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Enter PDF password to unlock and download password-free:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="password"
                      placeholder="Enter PDF password"
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      className="flex-1 min-w-[180px] rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={!unlockPassword || copyBusy}
                      onClick={() => void downloadVerifiedPdf(unlockPassword)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                    >
                      Unlock & Download
                    </button>
                  </div>
                </div>
              )}

              {copyError && (
                <p role="alert" className="mt-2 text-xs text-red-600 font-semibold">
                  {copyError}
                </p>
              )}

              <div className="mt-2.5 space-y-1 text-[11px] text-emerald-900/80 dark:text-emerald-300 leading-relaxed">
                <p>
                  ✓ <strong>Verified PDF:</strong> Updates the yellow question mark (?) box into the official verified Green Tick (✔) &quot;Signature valid&quot; stamp.
                </p>
                <p className="flex items-center gap-1 text-emerald-950 dark:text-emerald-200 font-medium">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong>Password Removed:</strong> The downloaded verified PDF will open directly without asking for any password.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tamper Alert if backend verification failed */}
      {isServerTampered && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-950 dark:text-rose-100 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="font-bold text-base text-rose-900 dark:text-rose-200">
                Signature Verification Failed / Document Altered
              </h3>
              <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">
                {job.serverVerification?.error || "The cryptographic signature hash does not match document content bytes. The document has been modified after signing."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Evidence & Reports */}
      {job.status === "done" && job.evidence && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              disabled={reportBusy}
              onClick={() => void downloadReport()}
              className="inline-flex gap-2 items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              {reportBusy ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{reportBusy ? "Creating report..." : "Download MSYN verification report"}</span>
            </button>
          </div>
          {reportError && <p role="alert" className="text-xs text-red-600 font-medium">{reportError}</p>}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
            <strong>Original SHA-256:</strong> {job.evidence.sha256}
          </p>
          <details onToggle={(event) => setPreviewOpen(event.currentTarget.open)}>
            <summary className="cursor-pointer py-1.5 text-xs font-bold text-violet-700 dark:text-violet-400 hover:underline">
              Preview PDF with visual signature markers
            </summary>
            {previewOpen && (
              <EsignPdfPreview
                file={job.file}
                password={job.previewPassword}
                results={job.results ?? []}
                signerName={job.serverVerification?.signerName}
                signingTime={job.serverVerification?.signingTime}
              />
            )}
          </details>
        </div>
      )}

      {job.status === "checking" && (
        <p role="status" className="flex gap-2 items-center mt-3 text-xs text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin text-violet-600" />
          <span>Verifying digital signature with CCA India cryptographic root store...</span>
        </p>
      )}

      {job.status === "error" && (
        <p role="alert" className="text-red-700 dark:text-red-400 mt-2 text-xs font-semibold">
          {job.message} This PDF has not been verified.
        </p>
      )}

      {job.status === "password" && (
        <form
          className="flex flex-wrap gap-2 mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            onRetry(password);
            setPassword("");
          }}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">PDF password (local only)</span>
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm max-w-full"
              required
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
          >
            Unlock and verify
          </button>
          <p className="w-full text-[11px] text-slate-500 dark:text-slate-400">
            {job.message} The password opens the original PDF in memory; no rewritten copy is saved.
          </p>
        </form>
      )}
    </div>
  );
}

export function EsignVerifyTool() {
  const [batch, setBatch] = useState<{
    version: number;
    jobs: Job[];
    extra: number;
  } | null>(null);
  const version = useRef(0);

  useEffect(() => () => {
    ++version.current;
  }, []);

  const run = async (file: File, index: number, id: number, password?: string) => {
    const update = (patch: Partial<Job>) => {
      if (version.current !== id) return;
      setBatch((previous) =>
        previous
          ? {
              ...previous,
              jobs: previous.jobs.map((job, i) => (i === index ? { ...job, ...patch } : job)),
            }
          : null
      );
    };

    update({ status: "checking", message: undefined, evidence: undefined, previewPassword: undefined });

    try {
      // 1. Inspect evidence and handle passwords locally
      const { inspectPdfEvidence } = await import("@/lib/pdf-signature-check");
      const evidence = await inspectPdfEvidence(file, password);

      // 2. Cryptographically verify signature and CCA India Root Trust via backend API
      let serverVerification: ServerVerificationResult | undefined;
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/verify-pdf", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          serverVerification = (await response.json()) as ServerVerificationResult;
        } else {
          const errData = await response.json().catch(() => null);
          if (errData?.error) {
            serverVerification = {
              verified: false,
              chainTrusted: false,
              signerName: "",
              signingTime: null,
              error: errData.error,
            };
          }
        }
      } catch {
        // network fallback (local inspection remains visible)
      }

      update({
        status: "done",
        results: evidence.results,
        evidence,
        previewPassword: password,
        serverVerification,
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "PasswordException") {
        update({
          status: "password",
          message: password ? "The password was not accepted." : "The original PDF is password-protected.",
        });
      } else {
        update({
          status: "error",
          message: error instanceof Error ? error.message : "The check could not be completed.",
        });
      }
    }
  };

  const checkFiles = (incoming: File[]) => {
    const files = incoming.filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );
    if (!files.length) return;
    const id = ++version.current,
      selected = files.slice(0, 5);
    setBatch({
      version: id,
      jobs: selected.map((file) => ({ file, status: "checking" })),
      extra: files.length - selected.length,
    });
    void (async () => {
      for (const [index, file] of selected.entries()) {
        if (version.current !== id) break;
        await run(file, index, id);
      }
    })();
  };

  const visible = batch;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.type === "file") {
      checkFiles(Array.from(input.files ?? []));
    }
  };

  return (
    <div className="space-y-5">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          checkFiles(Array.from(event.dataTransfer.files));
        }}
        className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center shadow-xs transition-colors hover:border-violet-500"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400 mb-3">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <label htmlFor="esign-pdf-upload" className="block text-base font-bold text-slate-900 dark:text-white mb-1 cursor-pointer">
            Select or Drop Aadhaar & Signed PDF files
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
            Validates document byte-range integrity and cross-verifies digital certificate trust against the official CCA India 2022 Root Store.
          </p>
          <input
            id="esign-pdf-upload"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={onChange}
            className="block w-full max-w-xs text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-violet-700 file:cursor-pointer"
          />
        </div>
      </div>

      {visible && (
        <aside
          aria-label="PDF signature check"
          className="mx-auto my-4 max-w-5xl rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 text-sm text-amber-950 dark:text-amber-100 shadow-sm"
        >
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Cryptographic PDF Signature & CCA India Trust Check
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Verifies cryptographic /ByteRange data coverage and CCA India 2022 root authority trust. Password-protected PDFs are decrypted in-memory.
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss signature check"
              title="Dismiss signature check"
              onClick={() => {
                ++version.current;
                setBatch(null);
              }}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {visible.extra > 0 && (
            <p className="font-semibold text-xs mt-3 text-amber-800 dark:text-amber-300">
              Only the first five PDFs are checked simultaneously. {visible.extra} additional files were not checked.
            </p>
          )}

          {visible.jobs.map((job, index) => (
            <FileResult
              key={visible.version + "-" + index}
              job={job}
              onRetry={(password) => void run(job.file, index, visible.version, password)}
            />
          ))}
        </aside>
      )}
    </div>
  );
}
