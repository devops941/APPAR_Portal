"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Send,
  Building2, Mail, Phone, MapPin, User, FileCheck, Shield,
  Clock, Calendar, Award, Edit3, FileText, Download, ExternalLink,
  Eye, FileCheck2, Cloud, Plus
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import {
  DocumentPreviewModal,
  type PreviewableDocument,
} from "@/components/ui/DocumentPreviewModal";
import {
  InstitutionDocumentUploader,
  type InstitutionDocItem,
} from "@/components/institutions/InstitutionDocumentUploader";
import Link from "next/link";

interface Institution {
  _id: string;
  name: string;
  code: string;
  category: string;
  address: { street: string; city: string; district: string; state: string; pincode: string };
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  approvalReference: string;
  status: string;
  documents?: InstitutionDocItem[];
  reviewRemarks?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export default function InstitutionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string; institutionId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);

  async function handleDirectSaveDocs(newDocs: InstitutionDocItem[]) {
    setSavingDocs(true);
    try {
      const res = await fetch(`/api/institutions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: newDocs }),
      });
      const data = await res.json();
      if (data.success) {
        setInstitution((prev) =>
          prev ? { ...prev, documents: newDocs } : prev
        );
      }
    } catch (e) {
      console.error("Failed to save documents to institution:", e);
    } finally {
      setSavingDocs(false);
    }
  }

  useEffect(() => {
    fetch(`/api/institutions/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setInstitution(data.data.institution);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) setCurrentUser(data.data);
      })
      .catch(() => {});
  }, [params.id]);

  async function handleSubmit() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/${params.id}/submit`, { method: "POST" });
      const data = await res.json();
      if (data.success) setInstitution(data.data.institution);
    } catch {
      setError("Failed to submit institution for review.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading statutory institutional record...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="space-y-4 p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-800">Institution Not Found</h2>
        <p className="text-xs text-slate-500">The requested institutional record could not be found or has been archived.</p>
        <Link href="/institutions">
          <Button size="sm" variant="secondary">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Institutions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/institutions")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Institutions Directory
        </button>
        <span className="font-mono text-xs text-slate-400">ID: {institution._id}</span>
      </div>

      {/* Main Institution Hero Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold shadow-sm ring-1 ring-emerald-500/10">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {institution.name}
                </h1>
                <StatusBadge status={institution.status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">CODE: {institution.code}</span>
                <span>•</span>
                <span>{institution.category?.replace(/_/g, " ")}</span>
                <span>•</span>
                <span>Ref: {institution.approvalReference}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {institution.address?.city || institution.address?.district}, {institution.address?.state}
            </span>

            <Link href={`/institutions/${params.id}/edit`}>
              <Button size="sm" variant="outline" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Details</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="Verification Status"
          value={institution.status}
          change="AICTE / State Portal"
          trend="neutral"
          theme={institution.status === "VERIFIED" ? "emerald" : institution.status === "REJECTED" ? "rose" : "amber"}
          icon={Shield}
        />
        <KpiStatCard
          label="Head of Institution"
          value={institution.principalName}
          change="Principal / Dean"
          trend="neutral"
          theme="emerald"
          icon={User}
        />
        <KpiStatCard
          label="Statutory Reference"
          value={institution.approvalReference}
          change="Official Order No."
          trend="neutral"
          theme="default"
          icon={Award}
        />
        <KpiStatCard
          label="Contact Clearance"
          value={institution.contactPhone}
          change={institution.contactEmail}
          trend="neutral"
          theme="default"
          icon={Mail}
        />
      </div>

      {/* Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Institutional Credentials & Address */}
        <div className="space-y-6 lg:col-span-8">
          {/* Institutional Information */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Institutional Governance & Records</h3>
              <span className="text-xs font-semibold text-emerald-600">Statutory Profile</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="font-semibold text-slate-500">Principal / Director Name</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{institution.principalName}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="font-semibold text-slate-500">Regulatory Approval Reference</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">{institution.approvalReference}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="font-semibold text-slate-500">Official Contact Email</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{institution.contactEmail}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="font-semibold text-slate-500">Official Telephone Number</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">{institution.contactPhone}</p>
              </div>
            </div>
          </div>

          {/* Campus Location */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Registered Campus Address</h3>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs font-medium text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm">{institution.address?.street}</p>
              <p className="mt-1 text-slate-600">
                City: <span className="font-semibold text-slate-900">{institution.address?.city}</span> · District: <span className="font-semibold text-slate-900">{institution.address?.district}</span>
              </p>
              <p className="text-slate-600">
                State: <span className="font-semibold text-slate-900">{institution.address?.state}</span> · Pincode: <span className="font-mono font-bold text-slate-900">{institution.address?.pincode}</span>
              </p>
            </div>
          </div>

          {/* Statutory Accreditation Documents */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Statutory Accreditation Documents</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <Cloud className="h-3.5 w-3.5" /> Cloudinary Verified
                </span>
                <Button
                  size="sm"
                  variant={showUploader ? "secondary" : "primary"}
                  onClick={() => setShowUploader(!showUploader)}
                  className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showUploader ? "Close Uploader" : "Upload Documents"}</span>
                </Button>
              </div>
            </div>

            {/* In-Place Direct Document Uploader */}
            {showUploader && (
              <div className="mt-4 animate-in fade-in">
                <InstitutionDocumentUploader
                  documents={institution.documents || []}
                  onChange={(newDocs) => {
                    setInstitution((prev) =>
                      prev ? { ...prev, documents: newDocs } : prev
                    );
                  }}
                  onDirectSave={handleDirectSaveDocs}
                  institutionId={institution._id}
                  disabled={savingDocs}
                />
              </div>
            )}

            {(!institution.documents || institution.documents.length === 0) ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No Statutory Documents Attached</p>
                <p className="mt-0.5 text-slate-400">
                  Click &quot;Upload Documents&quot; above to attach statutory AICTE letters or UGC orders to this profile.
                </p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                {institution.documents.map((doc, idx) => {
                  const formattedSize = doc.fileSizeBytes
                    ? doc.fileSizeBytes > 1024 * 1024
                      ? `${(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                      : `${Math.round(doc.fileSizeBytes / 1024)} KB`
                    : null;

                  const isPdf =
                    doc.mimeType?.includes("pdf") ||
                    doc.originalFileName?.toLowerCase().endsWith(".pdf");

                  const downloadUrl = `/api/institutions/${institution._id}/documents/${doc._id || doc.storageKey}/download`;
                  const streamUrl = doc.storageKey
                    ? `/api/institutions/preview?key=${encodeURIComponent(
                        doc.storageKey
                      )}&provider=${doc.storageProvider || "cloudinary"}&name=${encodeURIComponent(
                        doc.originalFileName
                      )}`
                    : "";
                  const effectiveUrl = doc.url || downloadUrl || streamUrl;

                  return (
                    <div
                      key={doc._id?.toString() || doc.storageKey || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition hover:bg-slate-100/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* High-res Image Thumbnail or PDF Badge */}
                        {!isPdf && effectiveUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={effectiveUrl}
                            alt={doc.title}
                            className="h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90 transition"
                            onClick={() =>
                              setPreviewDoc({
                                title: doc.title,
                                documentType: doc.documentType,
                                originalFileName: doc.originalFileName,
                                mimeType: doc.mimeType,
                                fileSizeBytes: doc.fileSizeBytes,
                                sha256Hash: doc.sha256Hash,
                                url: doc.url || effectiveUrl,
                                downloadUrl,
                                storageKey: doc.storageKey,
                              })
                            }
                            onError={(e) => {
                              if (streamUrl && e.currentTarget.src !== streamUrl) {
                                e.currentTarget.src = streamUrl;
                              }
                            }}
                          />
                        ) : (
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
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
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {doc.title}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                              {doc.documentType?.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                            {doc.originalFileName}
                            {formattedSize && ` • ${formattedSize}`}
                            {doc.sha256Hash && ` • Seal: ${doc.sha256Hash.substring(0, 10)}...`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              title: doc.title,
                              documentType: doc.documentType,
                              originalFileName: doc.originalFileName,
                              mimeType: doc.mimeType,
                              fileSizeBytes: doc.fileSizeBytes,
                              sha256Hash: doc.sha256Hash,
                              url: doc.url || effectiveUrl,
                              downloadUrl,
                              storageKey: doc.storageKey,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Document</span>
                        </button>

                        <a
                          href={downloadUrl}
                          download={doc.originalFileName}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Download</span>
                        </a>

                        <a
                          href={effectiveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer"
                          title="Open in Tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review Remarks Log */}
          {institution.reviewRemarks && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Scrutiny Decision History</h3>
                </div>
                {institution.reviewedAt && (
                  <span className="text-xs text-slate-400">
                    Reviewed: {new Date(institution.reviewedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap">
                  {institution.reviewRemarks}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Statutory Standing & Governance */}
        <div className="space-y-6 lg:col-span-4">
          {/* Institutional Standing Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Institutional Standing</h3>
                <StatusBadge status={institution.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Statutory lifecycle state under National APAAR Registry</p>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 ring-1 ring-rose-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {institution.status === "DRAFT" && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200/60 text-xs text-amber-800">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-600" /> Draft Record
                    </p>
                    <p className="mt-1 text-amber-700 leading-relaxed">
                      This institutional profile is currently in draft. Once all data is verified, submit it to the Statutory Verification Desk for official AICTE scrutiny.
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={acting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {acting ? "Submitting..." : "Submit for Scrutiny"}
                  </Button>
                </div>
              )}

              {(institution.status === "SUBMITTED" || institution.status === "UNDER_REVIEW") && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-indigo-50/70 p-3.5 border border-indigo-200/60 text-xs text-indigo-900">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-indigo-600" /> Awaiting Scrutiny
                    </p>
                    <p className="mt-1 text-indigo-700 leading-relaxed">
                      Submitted application is actively queued in the AICTE Statutory Verification Desk. Scrutiny officers will examine institutional accreditation.
                    </p>
                  </div>
                  {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "VERIFICATION_OFFICER") && (
                    <Link href="/verifications">
                      <Button
                        variant="secondary"
                        className="w-full border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer gap-2"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Open in Verification Desk
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {institution.status === "CORRECTION_REQUIRED" && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-rose-50/70 p-3.5 border border-rose-200/60 text-xs text-rose-800">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-rose-600" /> Revisions Requested
                    </p>
                    <p className="mt-1 text-rose-700 leading-relaxed">
                      Scrutiny officer has requested corrections. Please update the details via &quot;Edit Details&quot; and resubmit for review.
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={acting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {acting ? "Resubmitting..." : "Resubmit for Scrutiny"}
                  </Button>
                </div>
              )}

              {institution.status === "VERIFIED" && (
                <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200/60 text-xs text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="font-bold">Officially Verified & Compliant</p>
                  </div>
                  <p className="text-emerald-700/90 leading-relaxed">
                    This institution has successfully passed statutory scrutiny and holds full operational standing in the National APAAR registry.
                  </p>
                </div>
              )}

              {institution.status === "REJECTED" && (
                <div className="rounded-xl bg-rose-50/70 p-3.5 border border-rose-200/60 text-xs text-rose-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <p className="font-bold">Application Rejected</p>
                  </div>
                  <p className="text-rose-700 leading-relaxed">
                    This institutional affiliation was rejected by statutory officers. Contact regulatory authority for appeal or rectification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Institutional Metadata Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              Statutory Checklist
            </h4>
            <div className="flex items-center justify-between text-slate-600">
              <span>AISHE Status</span>
              <span className="font-semibold text-emerald-600">Validated</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Tenant Isolation</span>
              <span className="font-semibold text-indigo-600">Scoped</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Audit Logging</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Document Viewer */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        institutionName={institution.name}
      />
    </div>
  );
}
