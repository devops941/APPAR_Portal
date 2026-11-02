"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  FileCheck2,
  Trash2,
  Eye,
  AlertCircle,
  Cloud,
  CheckCircle2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DocumentPreviewModal,
  type PreviewableDocument,
} from "@/components/ui/DocumentPreviewModal";
import type { InstitutionDocumentType } from "@/models/Institution";

export interface InstitutionDocItem {
  _id?: string;
  title: string;
  documentType: InstitutionDocumentType;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageProvider: "cloudinary" | "local";
  sha256Hash: string;
  url?: string;
  uploadedAt: string | Date;
}

export const DOCUMENT_TYPE_LABELS: Record<InstitutionDocumentType, string> = {
  AICTE_APPROVAL: "AICTE Statutory Approval Order / EOA",
  UGC_RECOGNITION: "UGC 2(f) / 12(B) Statutory Recognition",
  AFFILIATION_CERTIFICATE: "University Affiliation Certificate",
  LAND_OWNERSHIP: "Campus Land / Infrastructure Deed",
  GOV_NOC: "State Government NOC / Gazette Order",
  SOCIETY_TRUST_DEED: "Educational Society / Trust Registration",
  OTHER: "Other Statutory Credential",
};

interface InstitutionDocumentUploaderProps {
  documents: InstitutionDocItem[];
  onChange: (docs: InstitutionDocItem[]) => void;
  disabled?: boolean;
  institutionId?: string;
  onDirectSave?: (newDocs: InstitutionDocItem[]) => Promise<void>;
}

export function InstitutionDocumentUploader({
  documents,
  onChange,
  disabled = false,
  institutionId,
  onDirectSave,
}: InstitutionDocumentUploaderProps) {
  const [selectedType, setSelectedType] =
    useState<InstitutionDocumentType>("AICTE_APPROVAL");
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; progress: boolean }[]
  >([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload a single file to Cloudinary
  const uploadSingleFile = async (
    file: File,
    type: InstitutionDocumentType
  ): Promise<InstitutionDocItem | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", type);
    const defaultTitle =
      file.name.replace(/\.[^/.]+$/, "") || DOCUMENT_TYPE_LABELS[type];
    formData.append("title", defaultTitle);

    const res = await fetch("/api/institutions/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.data?.document) {
      return data.data.document as InstitutionDocItem;
    } else {
      throw new Error(
        data?.error?.message || `Failed to upload ${file.name} to Cloudinary.`
      );
    }
  };

  // Handle multiple files selected
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    setUploadError(null);
    const filesArray = Array.from(fileList);

    // Track uploading state
    setUploadingFiles(
      filesArray.map((f) => ({ name: f.name, progress: true }))
    );

    const newlyUploaded: InstitutionDocItem[] = [];
    const errors: string[] = [];

    for (const file of filesArray) {
      try {
        const uploadedDoc = await uploadSingleFile(file, selectedType);
        if (uploadedDoc) {
          newlyUploaded.push(uploadedDoc);
        }
      } catch (err) {
        console.error("Upload error for file", file.name, err);
        errors.push(
          err instanceof Error ? err.message : `Failed to upload ${file.name}`
        );
      }
    }

    setUploadingFiles([]);

    if (newlyUploaded.length > 0) {
      const updatedDocs = [...documents, ...newlyUploaded];
      onChange(updatedDocs);

      // If direct save callback provided (e.g. for existing institution), trigger it
      if (onDirectSave) {
        try {
          await onDirectSave(updatedDocs);
        } catch (saveErr) {
          console.error("Direct save error:", saveErr);
        }
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join(" | "));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    if (disabled) return;
    const updated = documents.filter((_, i) => i !== index);
    onChange(updated);

    if (onDirectSave) {
      try {
        await onDirectSave(updated);
      } catch (err) {
        console.error("Failed to persist removal:", err);
      }
    }
  };

  const handlePreview = (item: InstitutionDocItem) => {
    let downloadUrl = item.url || "";
    if (institutionId && item._id) {
      downloadUrl = `/api/institutions/${institutionId}/documents/${item._id}/download`;
    }
    if (!downloadUrl && item.storageKey) {
      downloadUrl = `/api/institutions/preview?key=${encodeURIComponent(
        item.storageKey
      )}&provider=${item.storageProvider || "cloudinary"}&name=${encodeURIComponent(
        item.originalFileName
      )}`;
    }

    setPreviewDoc({
      title: item.title,
      documentType: item.documentType,
      originalFileName: item.originalFileName,
      mimeType: item.mimeType,
      fileSizeBytes: item.fileSizeBytes,
      sha256Hash: item.sha256Hash,
      url: item.url || downloadUrl,
      downloadUrl: downloadUrl || item.url || "",
      storageKey: item.storageKey,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              Statutory Documents & Accreditations
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <Cloud className="h-3 w-3" /> Cloudinary Storage
              </span>
            </h2>
            <p className="text-xs text-text-secondary">
              Upload statutory approvals, university affiliations, and campus verification records
            </p>
          </div>
        </div>

        {documents.length > 0 && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {documents.length} {documents.length === 1 ? "Document" : "Documents"} Attached
          </span>
        )}
      </div>

      {/* Auto-Upload Drag & Drop Box */}
      {!disabled && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Default Document Category for New Files
              </label>
              <select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(e.target.value as InstitutionDocumentType)
                }
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-medium text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer"
              >
                {(
                  Object.keys(DOCUMENT_TYPE_LABELS) as InstitutionDocumentType[]
                ).map((typeKey) => (
                  <option key={typeKey} value={typeKey}>
                    {DOCUMENT_TYPE_LABELS[typeKey]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Drag & Drop / Click Zone with Auto-Upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
              isDragOver
                ? "border-emerald-600 bg-emerald-50/50"
                : "border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-xs">
              <Upload className="h-6 w-6" />
            </div>

            <p className="text-sm font-bold text-text">
              Click to browse or drag & drop multiple statutory files
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Files automatically upload directly to Cloudinary upon selection (PDF, PNG, JPEG up to 5MB)
            </p>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs border border-emerald-200">
              <Plus className="h-3.5 w-3.5" /> Select Multiple Files
            </span>
          </div>

          {/* Uploading progress items */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 animate-in fade-in">
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                Uploading {uploadingFiles.length} file(s) to Cloudinary...
              </p>
              <div className="space-y-1">
                {uploadingFiles.map((uf, i) => (
                  <p key={i} className="text-xs font-mono text-emerald-700 truncate">
                    • {uf.name} (uploading & computing SHA-256 seal...)
                  </p>
                ))}
              </div>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs font-medium text-danger animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* List of Attached Documents */}
      {documents.length === 0 && uploadingFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-secondary">
          <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="font-semibold text-text">No Statutory Documents Attached Yet</p>
          <p className="mt-0.5 text-text-secondary">
            Select files above to automatically archive AICTE approval, UGC orders, or land deeds.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Attached Documents ({documents.length})
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Cloudinary Secured
            </span>
          </div>

          <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
            {documents.map((doc, idx) => {
              const formattedSize = doc.fileSizeBytes
                ? doc.fileSizeBytes > 1024 * 1024
                  ? `${(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                  : `${Math.round(doc.fileSizeBytes / 1024)} KB`
                : null;

              const isPdf =
                doc.mimeType?.includes("pdf") ||
                doc.originalFileName?.toLowerCase().endsWith(".pdf");

              const streamUrl = doc.storageKey
                ? `/api/institutions/preview?key=${encodeURIComponent(
                    doc.storageKey
                  )}&provider=${doc.storageProvider || "cloudinary"}&name=${encodeURIComponent(
                    doc.originalFileName
                  )}`
                : "";
              const previewUrl = doc.url || streamUrl;

              return (
                <div
                  key={doc.storageKey || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition hover:bg-slate-50/80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail or Badge */}
                    {!isPdf && previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={doc.title}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90 transition"
                        onClick={() => handlePreview(doc)}
                        onError={(e) => {
                          if (streamUrl && e.currentTarget.src !== streamUrl) {
                            e.currentTarget.src = streamUrl;
                          }
                        }}
                      />
                    ) : (
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                          isPdf
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        }`}
                      >
                        {isPdf ? "PDF" : "IMG"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-text truncate">
                          {doc.title}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                          {doc.documentType?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate mt-0.5 font-mono">
                        {doc.originalFileName}
                        {formattedSize && ` • ${formattedSize}`}
                        {doc.sha256Hash && ` • Seal: ${doc.sha256Hash.substring(0, 10)}...`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-50 transition cursor-pointer"
                      title="View & Preview Document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>

                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-white p-1.5 text-xs text-text-secondary hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                        title="Open in Tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}

                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="inline-flex items-center gap-1 rounded-lg border border-danger/20 bg-danger/5 p-1.5 text-xs font-semibold text-danger hover:bg-danger/10 transition cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
