"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Clock,
  FileText,
  Lock,
  UserCheck,
  CheckCircle2,
  X,
  FileCheck,
  Building2,
  GraduationCap,
  Eye,
  MapPin,
  Mail,
  User
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import Link from "next/link";

const STATUS_TABS = [
  { value: "All", label: "All Queue" },
  { value: "PENDING", label: "Pending Review" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "VERIFIED", label: "Verified & Sealed" },
  { value: "CORRECTION_REQUIRED", label: "Correction Required" },
  { value: "REJECTED", label: "Rejected" },
];

interface VerificationRequest {
  _id: string;
  requestId: string;
  studentId: {
    fullName: string;
    registerNumber: string;
    apaarId?: string;
  } | null;
  targetType: string;
  targetId?: string;
  status: string;
  createdAt: string;
  decidedAt?: string;
  decisionRemarks?: string;
}

interface InstitutionRecord {
  _id: string;
  name: string;
  code: string;
  category: string;
  approvalReference: string;
  address: { street: string; city: string; district: string; state: string; pincode: string };
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  status: string;
  reviewRemarks?: string;
  reviewedAt?: string;
  createdAt: string;
}

export default function VerificationsPage() {
  const [queueMode, setQueueMode] = useState<"STUDENT_RECORDS" | "INSTITUTIONS">("INSTITUTIONS");
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Inspect Modal for Student Records
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [reqRemarks, setReqRemarks] = useState("");
  const [actingReq, setActingReq] = useState(false);

  // Inspect Modal for Institution Scrutiny
  const [selectedInst, setSelectedInst] = useState<InstitutionRecord | null>(null);
  const [instRemarks, setInstRemarks] = useState("");
  const [actingInst, setActingInst] = useState(false);
  const [instError, setInstError] = useState<string | null>(null);

  // Pagination (15 items per page)
  const PAGE_SIZE = 15;
  const [instPage, setInstPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, iRes] = await Promise.all([
        fetch(`/api/verifications`),
        fetch(`/api/institutions?limit=500`),
      ]);
      const [vData, iData] = await Promise.all([vRes.json(), iRes.json()]);

      if (vData.success) setRequests(vData.data.requests || []);
      if (iData.success) setInstitutions(iData.data.institutions || []);
    } catch (err) {
      console.error("Verification queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // If there are no student verification requests but there are institutions pending scrutiny,
  // automatically default to INSTITUTIONS tab so the user sees what's awaiting review immediately!
  useEffect(() => {
    if (requests.length === 0 && institutions.length > 0) {
      setQueueMode("INSTITUTIONS");
    }
  }, [requests.length, institutions.length]);

  // Filtered Student Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchStatus = statusFilter === "All" || req.status === statusFilter;
      const sName = req.studentId?.fullName || "";
      const regNo = req.studentId?.registerNumber || "";
      const reqId = req.requestId || "";
      const matchSearch =
        !search ||
        sName.toLowerCase().includes(search.toLowerCase()) ||
        regNo.toLowerCase().includes(search.toLowerCase()) ||
        reqId.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, search]);

  // Filtered Institutions
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      let matchStatus = true;
      if (statusFilter === "PENDING" || statusFilter === "UNDER_REVIEW") {
        matchStatus = inst.status === "DRAFT" || inst.status === "SUBMITTED" || inst.status === "UNDER_REVIEW";
      } else if (statusFilter === "VERIFIED") {
        matchStatus = inst.status === "VERIFIED";
      } else if (statusFilter === "CORRECTION_REQUIRED") {
        matchStatus = inst.status === "CORRECTION_REQUIRED";
      } else if (statusFilter === "REJECTED") {
        matchStatus = inst.status === "REJECTED";
      }

      const matchSearch =
        !search ||
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        inst.code.toLowerCase().includes(search.toLowerCase()) ||
        inst.principalName.toLowerCase().includes(search.toLowerCase()) ||
        inst.address?.city?.toLowerCase().includes(search.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [institutions, statusFilter, search]);

  // Reset pagination when filters or tabs change
  useEffect(() => {
    setInstPage(1);
    setReqPage(1);
  }, [search, statusFilter, queueMode]);

  // Pagination slices (15 items per page)
  const totalInstPages = Math.max(1, Math.ceil(filteredInstitutions.length / PAGE_SIZE));
  const paginatedInstitutions = useMemo(() => {
    const start = (instPage - 1) * PAGE_SIZE;
    return filteredInstitutions.slice(start, start + PAGE_SIZE);
  }, [filteredInstitutions, instPage]);

  const totalReqPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (reqPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, reqPage]);

  // Consolidated KPI Calculations
  const pendingInstitutions = institutions.filter(
    (i) => i.status === "DRAFT" || i.status === "SUBMITTED" || i.status === "UNDER_REVIEW"
  ).length;
  const pendingStudents = requests.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length;
  const totalPending = pendingInstitutions + pendingStudents;

  const verifiedInstitutions = institutions.filter((i) => i.status === "VERIFIED").length;
  const verifiedStudents = requests.filter((r) => r.status === "VERIFIED").length;
  const totalVerified = verifiedInstitutions + verifiedStudents;

  const underReviewTotal =
    institutions.filter((i) => i.status === "UNDER_REVIEW").length +
    requests.filter((r) => r.status === "UNDER_REVIEW").length;

  const correctionTotal =
    institutions.filter((i) => i.status === "CORRECTION_REQUIRED").length +
    requests.filter((r) => r.status === "CORRECTION_REQUIRED").length;

  // Decision Handler for Student Requests
  async function handleReqDecision(decision: "VERIFIED" | "REJECTED" | "CORRECTION_REQUIRED") {
    if (!selectedReq || reqRemarks.length < 5) return;
    setActingReq(true);
    try {
      const res = await fetch(`/api/verifications/${selectedReq.requestId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, remarks: reqRemarks }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedReq(null);
        setReqRemarks("");
        fetchAllData();
      } else {
        alert(data?.error?.message || "Decision processing failed");
      }
    } finally {
      setActingReq(false);
    }
  }

  // Decision Handler for Institution Scrutiny
  async function handleInstDecision(decision: "VERIFIED" | "REJECTED" | "CORRECTION_REQUIRED") {
    if (!selectedInst || instRemarks.trim().length < 5) {
      setInstError("Please provide scrutiny remarks (at least 5 characters).");
      return;
    }
    setActingInst(true);
    setInstError(null);
    try {
      const res = await fetch(`/api/institutions/${selectedInst._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, remarks: instRemarks }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedInst(null);
        setInstRemarks("");
        fetchAllData();
      } else {
        setInstError(data?.error?.message || "Failed to record institutional review decision.");
      }
    } catch {
      setInstError("Network error recording institutional scrutiny decision.");
    } finally {
      setActingInst(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Statutory Verification & Scrutiny Desk
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> AICTE Scrutiny System
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Scrutinize higher educational institutions, verify semester marksheets, and seal credentials.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="PENDING SCRUTINY QUEUE"
          value={totalPending}
          subtext={`${pendingInstitutions} Institutions · ${pendingStudents} Marksheets`}
          icon={Clock}
          theme="amber"
        />
        <KpiStatCard
          label="IN PROGRESS / SCRUTINY"
          value={underReviewTotal}
          subtext="Under active officer examination"
          icon={ShieldCheck}
          theme="indigo"
        />
        <KpiStatCard
          label="VERIFIED & SEALED"
          value={totalVerified}
          subtext={`${verifiedInstitutions} HEIs · ${verifiedStudents} Credentials`}
          icon={CheckCircle2}
          theme="emerald"
        />
        <KpiStatCard
          label="CORRECTION TICKETS"
          value={correctionTotal}
          subtext="Revisions requested from submitter"
          icon={AlertCircle}
          theme="rose"
        />
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQueueMode("INSTITUTIONS")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
              queueMode === "INSTITUTIONS"
                ? "bg-emerald-600 text-white shadow-emerald-600/25"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Institutional Affiliations ({institutions.length})</span>
            {pendingInstitutions > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                queueMode === "INSTITUTIONS" ? "bg-white text-emerald-700" : "bg-amber-100 text-amber-800"
              }`}>
                {pendingInstitutions} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setQueueMode("STUDENT_RECORDS")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
              queueMode === "STUDENT_RECORDS"
                ? "bg-emerald-600 text-white shadow-emerald-600/25"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Student Marksheets & Vault ({requests.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Viewing: <strong className="text-slate-800">{queueMode === "INSTITUTIONS" ? "HEI Accreditation Queue" : "Student Credential Queue"}</strong>
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={queueMode === "INSTITUTIONS" ? "Search institution name, code, city..." : "Search request ID, student name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* MAIN VIEW: INSTITUTIONAL QUEUE */}
      {queueMode === "INSTITUTIONS" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="mt-3 text-xs font-medium text-slate-500">Loading statutory institutional queue...</p>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">No institutions match this filter</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                All affiliated institutions in this queue state have been scrutinized.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Institution Name & Code</th>
                    <th className="px-4 py-3.5">Category & AISHE</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Principal / Contact</th>
                    <th className="px-4 py-3.5">Scrutiny Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedInstitutions.map((inst) => {
                    const isPending = inst.status === "DRAFT" || inst.status === "SUBMITTED" || inst.status === "UNDER_REVIEW";
                    return (
                      <tr key={inst._id} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{inst.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="rounded bg-emerald-50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-700">
                                  {inst.code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{inst.category?.replace(/_/g, " ")}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Ref: {inst.approvalReference}</p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{inst.address?.city || "—"}</p>
                          <p className="text-[11px] text-slate-400">{inst.address?.state || "—"}</p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{inst.principalName || "Principal"}</p>
                          <p className="text-[11px] text-slate-400">{inst.contactEmail}</p>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={inst.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedInst(inst);
                                setInstRemarks(inst.reviewRemarks || "");
                                setInstError(null);
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                                isPending
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{isPending ? "Review & Decide" : "Re-Audit"}</span>
                            </button>

                            <Link
                              href={`/institutions/${inst._id}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Footer / Pagination (15 items per page) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/50">
                <p>
                  Showing <span className="font-semibold text-slate-800">
                    {filteredInstitutions.length === 0 ? 0 : (instPage - 1) * PAGE_SIZE + 1}
                  </span> to <span className="font-semibold text-slate-800">
                    {Math.min(instPage * PAGE_SIZE, filteredInstitutions.length)}
                  </span> of{" "}
                  <span className="font-semibold text-slate-800">{filteredInstitutions.length}</span> institutions
                  {filteredInstitutions.length !== institutions.length && (
                    <span className="text-slate-400"> (filtered from {institutions.length})</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={instPage <= 1}
                    onClick={() => setInstPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalInstPages }, (_, i) => i + 1)
                      .filter((pNum) => pNum === 1 || pNum === totalInstPages || Math.abs(pNum - instPage) <= 1)
                      .map((pNum, idx, arr) => {
                        const showEllipsis = idx > 0 && pNum - arr[idx - 1] > 1;
                        return (
                          <div key={pNum} className="flex items-center">
                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setInstPage(pNum)}
                              className={`h-7 w-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                instPage === pNum
                                  ? "bg-emerald-600 text-white shadow-2xs"
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
                    disabled={instPage >= totalInstPages}
                    onClick={() => setInstPage((p) => Math.min(totalInstPages, p + 1))}
                    className="cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN VIEW: STUDENT MARKSHEETS QUEUE */}
      {queueMode === "STUDENT_RECORDS" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="mt-3 text-xs font-medium text-slate-500">Querying marksheet verification queue...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">No marksheet requests found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                All submitted marksheet credentials and certificates have been scrutinized.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-4 py-3.5">Student Details</th>
                    <th className="px-4 py-3.5">Target Type</th>
                    <th className="px-4 py-3.5">Submitted On</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedRequests.map((req) => (
                    <tr key={req._id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {req.requestId}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{req.studentId?.fullName || "Student Record"}</p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {req.studentId?.registerNumber} · {req.studentId?.apaarId || "No APAAR"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                          {req.targetType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setReqRemarks(req.decisionRemarks || "");
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Footer / Pagination (15 items per page) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/50">
                <p>
                  Showing <span className="font-semibold text-slate-800">
                    {filteredRequests.length === 0 ? 0 : (reqPage - 1) * PAGE_SIZE + 1}
                  </span> to <span className="font-semibold text-slate-800">
                    {Math.min(reqPage * PAGE_SIZE, filteredRequests.length)}
                  </span> of{" "}
                  <span className="font-semibold text-slate-800">{filteredRequests.length}</span> requests
                  {filteredRequests.length !== requests.length && (
                    <span className="text-slate-400"> (filtered from {requests.length})</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={reqPage <= 1}
                    onClick={() => setReqPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalReqPages }, (_, i) => i + 1)
                      .filter((pNum) => pNum === 1 || pNum === totalReqPages || Math.abs(pNum - reqPage) <= 1)
                      .map((pNum, idx, arr) => {
                        const showEllipsis = idx > 0 && pNum - arr[idx - 1] > 1;
                        return (
                          <div key={pNum} className="flex items-center">
                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setReqPage(pNum)}
                              className={`h-7 w-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                reqPage === pNum
                                  ? "bg-emerald-600 text-white shadow-2xs"
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
                    disabled={reqPage >= totalReqPages}
                    onClick={() => setReqPage((p) => Math.min(totalReqPages, p + 1))}
                    className="cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSTITUTION SCRUTINY MODAL / DRAWER */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedInst.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    CODE: {selectedInst.code} · {selectedInst.category?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInst(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {instError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-500/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{instError}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400 font-medium">Head of Institution</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedInst.principalName || "Not Designated"}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{selectedInst.contactEmail}</p>
                {selectedInst.contactPhone && (
                  <p className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
                    <span>🇮🇳</span> {selectedInst.contactPhone}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400 font-medium">Registered Campus & Geo</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {selectedInst.address?.district || selectedInst.address?.city}, {selectedInst.address?.state}
                </p>
                <p className="text-[11px] text-slate-600">{selectedInst.address?.street}</p>
                {selectedInst.address?.pincode && (
                  <span className="inline-block mt-1 font-mono text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                    PIN: {selectedInst.address.pincode}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Statutory Review Remarks (Mandatory for audit trail) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Enter statutory inspection notes, compliance check against AISHE records, or reason for decision..."
                value={instRemarks}
                onChange={(e) => setInstRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInst(null)}
                disabled={actingInst}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleInstDecision("CORRECTION_REQUIRED")}
                disabled={actingInst}
                className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold"
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5 text-amber-600" /> Request Corrections
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleInstDecision("REJECTED")}
                disabled={actingInst}
                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5 text-rose-600" /> Reject
              </Button>

              <Button
                size="sm"
                onClick={() => handleInstDecision("VERIFIED")}
                disabled={actingInst}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve & Verify HEI
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MARKSHEET INSPECT MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Scrutinize Marksheet: {selectedReq.requestId}
                </h3>
                <p className="text-xs text-slate-500">
                  Candidate: {selectedReq.studentId?.fullName} ({selectedReq.studentId?.registerNumber})
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Scrutiny Officer Remarks (Min 5 chars) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter justification, verified marks evidence, or correction instructions..."
                value={reqRemarks}
                onChange={(e) => setReqRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedReq(null)}
                disabled={actingReq}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleReqDecision("CORRECTION_REQUIRED")}
                disabled={actingReq}
                className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              >
                Request Correction
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleReqDecision("REJECTED")}
                disabled={actingReq}
                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleReqDecision("VERIFIED")}
                disabled={actingReq}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Verify & Seal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
