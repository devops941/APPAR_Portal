"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ScrollText, Download, Search, Filter, Shield, Activity,
  Lock, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2,
  AlertTriangle, KeyRound, UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";

const AUDIT_ACTIONS = [
  { value: "ALL", label: "All Audit Actions" },
  { value: "USER_LOGIN", label: "User Login" },
  { value: "USER_LOGOUT", label: "User Logout" },
  { value: "INSTITUTION_CREATED", label: "Institution Created" },
  { value: "INSTITUTION_VERIFIED", label: "Institution Verified" },
  { value: "INSTITUTION_REJECTED", label: "Institution Rejected" },
  { value: "STUDENT_CREATED", label: "Student Created" },
  { value: "STUDENT_IMPORTED", label: "Batch Students Imported" },
  { value: "APAAR_REVEALED", label: "APAAR ID Revealed" },
  { value: "ACADEMIC_RECORD_SUBMITTED", label: "Record Submitted" },
  { value: "ACADEMIC_RECORD_VERIFIED", label: "Record Verified" },
  { value: "DOCUMENT_UPLOADED", label: "Document Uploaded" },
  { value: "DOCUMENT_DOWNLOADED", label: "Document Downloaded" },
];

const ROLE_FILTERS = [
  { value: "ALL", label: "All Roles" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "VERIFICATION_OFFICER", label: "Scrutiny Officer" },
  { value: "COLLEGE_ADMIN", label: "College Admin" },
  { value: "STUDENT", label: "Student" },
];

interface AuditLogEntry {
  _id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  safeChangesSummary?: string;
  ipAddress?: string;
  occurredAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        setTotal(data.meta?.total || 0);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side filtering for search & role
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.safeChangesSummary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.ipAddress || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "ALL" || log.actorRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [logs, searchQuery, roleFilter]);

  // Quick stats calculation
  const loginCount = useMemo(() => logs.filter((l) => l.action.includes("LOGIN")).length, [logs]);
  const mutationCount = useMemo(() => logs.filter((l) => !l.action.includes("LOGIN") && !l.action.includes("LOGOUT")).length, [logs]);
  const apaarRevealCount = useMemo(() => logs.filter((l) => l.action === "APAAR_REVEALED").length, [logs]);

  function exportCsv() {
    const headers = ["Timestamp", "Actor Email", "Role", "Action", "Entity", "Summary", "IP Address"];
    const rows = filteredLogs.map((l) => [
      new Date(l.occurredAt).toISOString(),
      l.actorEmail,
      l.actorRole,
      l.action,
      l.entityType,
      l.safeChangesSummary || "",
      l.ipAddress || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apaar-statutory-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function getActionBadgeStyle(action: string) {
    if (action.includes("VERIFIED")) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (action.includes("REJECTED")) return "bg-rose-50 text-rose-700 ring-rose-600/20";
    if (action.includes("REVEALED")) return "bg-amber-50 text-amber-700 ring-amber-600/20";
    if (action.includes("LOGIN")) return "bg-sky-50 text-sky-700 ring-sky-600/20";
    if (action.includes("CREATED") || action.includes("IMPORTED")) return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
    return "bg-slate-100 text-slate-700 ring-slate-600/20";
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 ring-1 ring-purple-600/20">Super Admin</span>;
      case "VERIFICATION_OFFICER":
        return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-600/20">Officer</span>;
      case "COLLEGE_ADMIN":
        return <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-600/20">College Admin</span>;
      default:
        return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-600/20">{role}</span>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Audit Trail</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> Tamper Evident
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Append-only statutory audit trail logging every credential mutation, login, and APAAR reveal
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            className="border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold shadow-sm"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={exportCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export Audit CSV
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="Total Logged Events"
          value={total.toLocaleString()}
          change="Append-Only Log"
          trend="up"
          theme="indigo"
          icon={ScrollText}
        />
        <KpiStatCard
          label="Mutations Logged"
          value={mutationCount}
          change="State Changes"
          trend="neutral"
          theme="default"
          icon={Activity}
        />
        <KpiStatCard
          label="Auth Sessions"
          value={loginCount}
          change="Access Checkpoints"
          trend="up"
          theme="emerald"
          icon={KeyRound}
        />
        <KpiStatCard
          label="APAAR Privacy Reveals"
          value={apaarRevealCount}
          change="10s Expiry Monitored"
          trend="neutral"
          theme="amber"
          icon={Lock}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, IP, action, or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              {AUDIT_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              {ROLE_FILTERS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Querying statutory audit log...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ScrollText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">No audit events found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              All platform mutations and authentication checkpoints are recorded automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Actor Details</th>
                  <th className="px-4 py-3.5">Action Event</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">Event Summary</th>
                  <th className="px-5 py-3.5 text-right">Network IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-indigo-50/30">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {new Date(log.occurredAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.occurredAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{log.actorEmail}</div>
                      <div className="mt-0.5">{getRoleBadge(log.actorRole)}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${getActionBadgeStyle(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {log.entityType}
                      </span>
                    </td>

                    <td className="px-4 py-4 max-w-md">
                      <span className="line-clamp-2 text-xs text-slate-600 font-medium">
                        {log.safeChangesSummary || "Standard compliance checkpoint recorded."}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-mono text-[11px] text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar (15 items per page) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-6 py-3.5 text-xs text-slate-500 bg-slate-50/50">
            <p>
              Showing page <span className="font-semibold text-slate-900">{page}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span> ({total} entries total)
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1)
                  .map((pNum, idx, arr) => {
                    const showEllipsis = idx > 0 && pNum - arr[idx - 1] > 1;
                    return (
                      <div key={pNum} className="flex items-center">
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setPage(pNum)}
                          className={`h-7 w-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            page === pNum
                              ? "bg-purple-600 text-white shadow-2xs"
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
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
