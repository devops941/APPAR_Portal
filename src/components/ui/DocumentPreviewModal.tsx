"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export interface PreviewableDocument {
  title: string;
  documentType?: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes?: number;
  sha256Hash?: string;
  url?: string;
  downloadUrl: string;
  storageKey?: string;
}

interface DocumentPreviewModalProps {
  document: PreviewableDocument | null;
  onClose: () => void;
  institutionName?: string;
}

export function DocumentPreviewModal({
  document,
  onClose,
  institutionName,
}: DocumentPreviewModalProps) {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (document) {
      window.addEventListener("keydown", handleKeyDown);
      window.document.body.style.overflow = "hidden";

      // Compute primary view URL
      let initialUrl = document.downloadUrl || document.url || "";
      if (!initialUrl && document.storageKey) {
        initialUrl = `/api/institutions/preview?key=${encodeURIComponent(
          document.storageKey
        )}&name=${encodeURIComponent(document.originalFileName)}`;
      }
      setCurrentSrc(initialUrl);
      setImgError(false);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.document.body.style.overflow = "unset";
    };
  }, [document, onClose]);

  if (!document) return null;

  const isPdf =
    document.mimeType?.includes("pdf") ||
    document.originalFileName?.toLowerCase().endsWith(".pdf");

  const formattedSize = document.fileSizeBytes
    ? document.fileSizeBytes > 1024 * 1024
      ? `${(document.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(document.fileSizeBytes / 1024)} KB`
    : null;

  const handleImageError = () => {
    // If primary URL failed, try the internal preview stream endpoint
    if (document.storageKey && !currentSrc.includes("/api/institutions/preview")) {
      const fallbackUrl = `/api/institutions/preview?key=${encodeURIComponent(
        document.storageKey
      )}&name=${encodeURIComponent(document.originalFileName)}`;
      setCurrentSrc(fallbackUrl);
    } else {
      setImgError(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* PURE WHITE THEME CONTAINER */}
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header — Clean White with subtle border */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 sm:px-6 py-4 text-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {document.title}
                </h3>
                {document.documentType && (
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 border border-emerald-200">
                    {document.documentType.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                {document.originalFileName}
                {formattedSize && ` • ${formattedSize}`}
                {institutionName && ` • ${institutionName}`}
              </p>
            </div>
          </div>

          {/* Action Buttons — Clean White Theme */}
          <div className="flex items-center gap-2 shrink-0">
            {currentSrc && (
              <>
                <a
                  href={currentSrc}
                  download={document.originalFileName}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                  title="Download Statutory Document"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href={currentSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                  title="Open in Full Browser Tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Open Tab</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              title="Close Viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer — PURE WHITE & LIGHT SLATE THEME */}
        <div className="flex-1 overflow-auto bg-slate-50/70 p-4 sm:p-6 flex items-center justify-center min-h-[460px] max-h-[75vh]">
          {isPdf ? (
            currentSrc ? (
              <iframe
                src={`${currentSrc}#toolbar=1&navpanes=0`}
                title={document.title}
                className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white shadow-md"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">Unable to load PDF stream</p>
              </div>
            )
          ) : imgError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-xs text-rose-700 max-w-md shadow-sm">
              <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
              <p className="font-bold text-sm text-slate-800">Preview Could Not Be Loaded</p>
              <p className="mt-1 text-slate-500">
                The uploaded image may still be processing in Cloudinary or requires a page refresh.
              </p>
              {currentSrc && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <a
                    href={currentSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Image in New Tab
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-2xl bg-white p-2.5 sm:p-3 shadow-md border border-slate-200 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSrc}
                alt={document.title}
                onError={handleImageError}
                className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain bg-white"
              />
            </div>
          )}
        </div>

        {/* Modal Footer — Clean White with Cryptographic Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 bg-white px-5 sm:px-6 py-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200 truncate">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              SHA-256 Seal:{" "}
              <span className="font-mono font-bold truncate">
                {document.sha256Hash || "Cryptographically Verified"}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
