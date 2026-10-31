"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  Upload,
  Copy,
  Check,
  ShieldCheck,
  HardDrive,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  X,
  Eye,
  Download,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";

const DOC_TYPES = [
  { value: "ALL", label: "All Document Types" },
  { value: "SEMESTER_MARKSHEET", label: "Semester Marksheet" },
  { value: "DEGREE_CERTIFICATE", label: "Degree Certificate" },
  { value: "TRANSFER_CERTIFICATE", label: "Transfer Certificate" },
  { value: "ADMISSION_PROOF", label: "Admission Proof" },
  { value: "BONAFIDE", label: "Bonafide Certificate" },
  { value: "OTHER", label: "Other Credential" },
];

const PAGE_SIZE = 15;

interface Doc {
  _id: string;
  title: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  status: string;
  fileUrl?: string;
  studentId?: {
    _id: string;
    fullName: string;
    registerNumber: string;
  };
  createdAt: string;
}

interface StudentOption {
  _id: string;
  fullName: string;
  registerNumber: string;
  institutionId?: string | { _id: string; name?: string };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [targetStudentId, setTargetStudentId] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("SEMESTER_MARKSHEET");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data?.documents || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success) {
        const studList = data.data?.students || [];
        setStudents(studList);
        if (studList.length > 0) setTargetStudentId(studList[0]._id);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    fetchStudents();
  }, [fetchDocs, fetchStudents]);

  function copyHash(hash: string, id: string) {
    navigator.clipboard.writeText(hash);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === "ALL" || doc.documentType === selectedType;

      const matchesStatus =
        selectedStatus === "ALL" || doc.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, selectedType, selectedStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedStatus]);

  // Pagination slice (15 records per page)
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDocuments.slice(start, start + PAGE_SIZE);
  }, [filteredDocuments, currentPage]);

  // Compute stats
  const totalDocs = documents.length;
  const verifiedDocs = documents.filter((d) => d.status === "VERIFIED").length;
  const totalSizeBytes = documents.reduce((sum, d) => sum + (d.fileSizeBytes || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const pendingDocs = documents.filter((d) => d.status === "PENDING").length;

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!targetStudentId) {
      setUploadError("Please select a student record.");
      return;
    }
    if (!docTitle.trim()) {
      setUploadError("Please enter a document title.");
      return;
    }

    const studentObj = students.find((s) => s._id === targetStudentId);
    const instId =
      typeof studentObj?.institutionId === "string"
        ? studentObj.institutionId
        : studentObj?.institutionId?._id;

    if (!instId) {
      setUploadError("Could not resolve institution for the selected student.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("studentId", targetStudentId);
    formData.append("institutionId", instId);
    formData.append("documentType", docType);
    formData.append("title", docTitle);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setDocTitle("");
        setSelectedFile(null);
        await fetchDocs();
      } else {
        setUploadError(data?.error?.message || "Upload failed. Please check file format and size.");
      }
    } catch {
      setUploadError("Network error occurred during document upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cryptographic Document Vault</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> SHA-256 Enforced
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Secure, tamper-evident statutory student credentials storage with cryptographic verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDocs}
            className="border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold shadow-sm"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Upload Document
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="Vault Documents"
          value={totalDocs}
          change="Total Uploads"
          trend="up"
          theme="indigo"
          icon={FileText}
        />
        <KpiStatCard
          label="Verified Integrity"
          value={verifiedDocs}
          change={`${totalDocs > 0 ? ((verifiedDocs / totalDocs) * 100).toFixed(0) : 0}% Attested`}
          trend="up"
          theme="emerald"
          icon={ShieldCheck}
        />
        <KpiStatCard
          label="Total Encrypted Storage"
          value={`${totalSizeMB} MB`}
          change="Local Vault Storage"
          trend="neutral"
          theme="default"
          icon={HardDrive}
        />
        <KpiStatCard
          label="Pending Scrutiny"
          value={pendingDocs}
          change="Queued for Officer Check"
          trend={pendingDocs > 0 ? "down" : "up"}
          theme="amber"
          icon={AlertCircle}
        />
      </div>

      {/* Advanced Filter & Search Row */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by document title, filename, or SHA-256 hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Document Type Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedStatus === st
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Decrypting vault manifest...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">No documents match your query</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Upload statutory marksheets, certificates, or admission proofs to securely archive them with cryptographic SHA-256 hashes.
            </p>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Upload Document Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Document Details</th>
                  <th className="px-4 py-3.5">Type & Category</th>
                  <th className="px-4 py-3.5">Size & MIME</th>
                  <th className="px-4 py-3.5">Cryptographic SHA-256</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedDocuments.map((doc) => (
                  <tr key={doc._id} className="transition hover:bg-indigo-50/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.title}</p>
                          <p className="text-[11px] text-slate-400">{doc.originalFileName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {doc.documentType.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">
                        {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{doc.mimeType}</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                          {doc.sha256Hash.substring(0, 16)}...
                        </code>
                        <button
                          onClick={() => copyHash(doc.sha256Hash, doc._id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copied === doc._id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={doc.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                        <a
                          href={`/api/documents/${doc._id}/download`}
                          download={doc.originalFileName}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table Footer / Pagination (15 items per page) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/50">
              <p>
                Showing <span className="font-semibold text-slate-800">
                  {filteredDocuments.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </span> to <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * PAGE_SIZE, filteredDocuments.length)}
                </span> of{" "}
                <span className="font-semibold text-slate-800">{filteredDocuments.length}</span> documents
                {filteredDocuments.length !== documents.length && (
                  <span className="text-slate-400"> (filtered from {documents.length})</span>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - currentPage) <= 1)
                    .map((pNum, idx, arr) => {
                      const showEllipsis = idx > 0 && pNum - arr[idx - 1] > 1;
                      return (
                        <div key={pNum} className="flex items-center">
                          {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                          <button
                            onClick={() => setCurrentPage(pNum)}
                            className={`h-7 w-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              currentPage === pNum
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                          >
                            {pNum}
                          </button>
                        </div>
                      );
                    })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Statutory Credential</h3>
                <p className="text-xs text-slate-500">
                  Document will be hashed with SHA-256 and stored in the secure tamper-proof vault
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-500/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {/* Target Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Associate Student Record <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.registerNumber})
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    No students found. Add a student first or load seed data.
                  </p>
                )}
              </div>

              {/* Title & Document Type */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sem 4 Official Marksheet"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {DOC_TYPES.filter((t) => t.value !== "ALL").map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  File Attachment (PDF, PNG, JPEG · Max 5MB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center hover:bg-slate-50">
                  <Upload className="mb-2 h-8 w-8 text-indigo-500" />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || "binary"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-700">
                        Click to select or drag & drop certificate file
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Compliant with DigiLocker / ABC standard formats
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={uploading || !selectedFile || students.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {uploading ? "Computing Hash & Uploading..." : "Upload & Validate Hash"}
                </Button>
              </div>
            </form>
            
          </div>
        </div>
      )}

      {/* In-App Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {previewDoc.title}
                    <span className="text-xs font-mono font-normal text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                      {previewDoc.documentType}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {previewDoc.originalFileName} · SHA-256: {previewDoc.sha256Hash?.slice(0, 16)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/documents/${previewDoc._id}/download`}
                  download={previewDoc.originalFileName}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  title="Download Statutory Credential"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href={`/api/documents/${previewDoc._id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  title="Open in New Tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-auto bg-slate-950/95 p-4 flex items-center justify-center min-h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/documents/${previewDoc._id}/download`}
                alt={previewDoc.title}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-slate-800 bg-white"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Cryptographically verified SHA-256 seal: {previewDoc.sha256Hash}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
