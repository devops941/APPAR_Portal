"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Eye,
  X,
  ExternalLink,
  MapPin,
  Mail,
  UserCheck,
  Edit3,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import { StateDistrictSelect } from "@/components/ui/StateDistrictSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { EmailInput } from "@/components/ui/EmailInput";
import { getAllStates, formatIndianPhone } from "@/lib/data/india-geo";

interface Institution {
  _id: string;
  name: string;
  code: string;
  category: string;
  address: {
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  approvalReference: string;
  status: string;
  createdAt?: string;
}

const CATEGORIES = [
  { value: "All", label: "All Categories" },
  { value: "ENGINEERING", label: "Engineering & Tech" },
  { value: "POLYTECHNIC", label: "Polytechnic Institute" },
  { value: "MANAGEMENT", label: "Management (MBA/PGDM)" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "ARTS_SCIENCE", label: "Arts & Science" },
];

const VERIFICATIONS = [
  { value: "All", label: "All Verifications" },
  { value: "VERIFIED", label: "Verified & Compliant" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "CORRECTION_REQUIRED", label: "Correction Required" },
  { value: "DRAFT", label: "Draft Stage" },
  { value: "REJECTED", label: "Rejected" },
];

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("");

  // Pagination (15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    approvalReference: "",
    category: "ENGINEERING",
    street: "",
    city: "",
    district: "",
    state: "Tamil Nadu",
    pincode: "",
    contactEmail: "",
    contactPhone: "",
    principalName: "",
  });

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (search) params.set("search", search);
      if (verificationFilter !== "All") params.set("status", verificationFilter);

      const res = await fetch(`/api/institutions?${params}`);
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.data.institutions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [search, verificationFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchInstitutions, 250);
    return () => clearTimeout(timer);
  }, [fetchInstitutions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, verificationFilter, stateFilter]);

  // Client-side category & state filtering
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchCategory =
        categoryFilter === "All" || inst.category === categoryFilter;
      const matchState =
        !stateFilter ||
        (inst.address?.state &&
          inst.address.state.toLowerCase().includes(stateFilter.toLowerCase()));
      return matchCategory && matchState;
    });
  }, [institutions, categoryFilter, stateFilter]);

  // Total pages and paginated slice (15 per page)
  const totalPages = Math.max(1, Math.ceil(filteredInstitutions.length / PAGE_SIZE));
  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInstitutions.slice(start, start + PAGE_SIZE);
  }, [filteredInstitutions, currentPage]);

  // Compute KPI Counts
  const totalCount = institutions.length;
  const verifiedCount = institutions.filter((i) => i.status === "VERIFIED").length;
  const pendingCount = institutions.filter(
    (i) => i.status === "SUBMITTED" || i.status === "UNDER_REVIEW" || i.status === "DRAFT"
  ).length;
  const activeCount = institutions.filter((i) => i.status !== "REJECTED").length;

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    if (!formData.state || !formData.district) {
      setErrorMsg("Please select a valid Indian State and District.");
      setSubmitting(false);
      return;
    }

    const formattedPhone = formData.contactPhone.startsWith("+91")
      ? formData.contactPhone
      : formatIndianPhone(formData.contactPhone);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: formData.category,
      approvalReference: formData.approvalReference.trim() || `AICTE-${Date.now()}`,
      address: {
        street: formData.street.trim() || "Main Campus",
        city: formData.city.trim() || formData.district.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
      contactEmail: formData.contactEmail.trim().toLowerCase(),
      contactPhone: formattedPhone || formData.contactPhone.trim(),
      principalName: formData.principalName.trim(),
    };

    try {
      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowRegisterModal(false);
        setFormData({
          name: "",
          code: "",
          approvalReference: "",
          category: "ENGINEERING",
          street: "",
          city: "",
          district: "",
          state: "",
          pincode: "",
          contactEmail: "",
          contactPhone: "",
          principalName: "",
        });
        fetchInstitutions();
      } else {
        setErrorMsg(data?.error?.message || "Failed to create institution");
      }
    } catch {
      setErrorMsg("Network error occurred. Please check database connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institution Management
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Directory of accredited technical universities, colleges, and affiliated institutes.
          </p>
        </div>

        <Link href="/institutions/new">
          <Button
            className="shadow-md shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Register Institution</span>
          </Button>
        </Link>
      </div>

      {/* Top 4 KPI Cards (Matching Screenshot 1) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="TOTAL INSTITUTES"
          value={totalCount}
          subtext="Registered technical institutions"
          icon={Building2}
          theme="default"
        />
        <KpiStatCard
          label="VERIFIED PROFILES"
          value={verifiedCount}
          subtext="Officially verified & compliant"
          icon={ShieldCheck}
          theme="emerald"
        />
        <KpiStatCard
          label="PENDING SCRUTINY"
          value={pendingCount}
          subtext="Awaiting statutory approval"
          icon={Clock}
          theme="amber"
        />
        <KpiStatCard
          label="ACTIVE ENROLLED"
          value={activeCount}
          subtext="Active portal participants"
          icon={CheckCircle2}
          theme="indigo"
        />
      </div>

      {/* Modern Filter & Search Bar (Matching Screenshot 1) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
          {/* Search Input */}
          <div className="relative lg:col-span-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, code, AICTE ID, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
            />
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              {VERIFICATIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter Dropdown (Dynamic Indian States Registry) */}
          <div className="lg:col-span-3">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="">All States & UTs (India)</option>
              {getAllStates().map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={fetchInstitutions}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs w-full lg:w-auto"
              title="Refresh Records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              <span className="lg:hidden">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table View */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Loading institutions registry...</p>
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-xs">
              <Building2 className="h-7 w-7 opacity-80" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No institutions found</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              No institution matched your filter criteria or the database is waiting for new registrations.
            </p>
            <Button
              size="sm"
              onClick={() => setShowRegisterModal(true)}
              className="mt-4"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register First Institution</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Institution Name & Code</th>
                  <th className="px-4 py-3.5">Category Type</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Contact / Admin</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedInstitutions.map((inst) => (
                  <tr
                    key={inst._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Name & Code */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {inst.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {inst.code}
                        </span>
                        {inst.approvalReference && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {inst.approvalReference}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category Type */}
                    <td className="px-4 py-4">
                      <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        {inst.category ? inst.category.replace(/_/g, " ") : "Technical"}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800">
                          {inst.address?.city || inst.address?.district || "—"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-4">
                        {inst.address?.state || "India"}
                      </div>
                    </td>

                    {/* Contact / Principal */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">
                        {inst.principalName || "Principal / Authorized Admin"}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[160px]">{inst.contactEmail}</span>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={inst.status} />
                    </td>

                    {/* Status Active */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/institutions/${inst._id}/edit`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition shadow-2xs"
                          title="Edit Institution Details"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </Link>

                        {inst.status !== "VERIFIED" ? (
                          <Link
                            href={`/institutions/${inst._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Review & Verify</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/institutions/${inst._id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition shadow-2xs"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
                          </Link>
                        )}
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
                  {filteredInstitutions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </span> to <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * PAGE_SIZE, filteredInstitutions.length)}
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
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-200"
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

      {/* Floating Center Modal: Register New Institution (Matching Screenshot 2) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Register New Institution
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Onboard an accredited college or technical institute for AICTE verification & APAAR tracking.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Institution Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Institute of Technology"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>

                {/* Institution Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Institution Code (Unique Identifier) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INST-NIT-004"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase font-mono text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>

                {/* AICTE Permanent ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    AICTE Permanent ID / Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-332910411"
                    value={formData.approvalReference}
                    onChange={(e) => setFormData({ ...formData, approvalReference: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Institution Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  >
                    <option value="ENGINEERING">Engineering & Technology</option>
                    <option value="POLYTECHNIC">Polytechnic Institute</option>
                    <option value="MANAGEMENT">Management (MBA/PGDM)</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="ARTS_SCIENCE">Arts & Science</option>
                  </select>
                </div>
              </div>

              {/* Campus Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Campus Address / Street
                </label>
                <textarea
                  rows={2}
                  placeholder="Complete postal address of the institution campus..."
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              {/* Institutional Statutory Location (State, District Cascade & City from country-state-city) */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Geographical Location & Postal Code
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Indian Administrative Registry
                  </span>
                </div>
                <StateDistrictSelect
                  selectedState={formData.state}
                  selectedDistrict={formData.district}
                  selectedCity={formData.city}
                  pincode={formData.pincode}
                  onStateChange={(state) => setFormData((prev) => ({ ...prev, state }))}
                  onDistrictChange={(district) =>
                    setFormData((prev) => ({ ...prev, district }))
                  }
                  onCityChange={(city) => setFormData((prev) => ({ ...prev, city }))}
                  onPincodeChange={(pincode) =>
                    setFormData((prev) => ({ ...prev, pincode }))
                  }
                  required
                />
              </div>

              {/* Standardized Communication Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EmailInput
                  label="Official Institutional Email"
                  placeholder="registrar@institution.edu.in"
                  value={formData.contactEmail}
                  onChange={(contactEmail) =>
                    setFormData((prev) => ({ ...prev, contactEmail }))
                  }
                  required
                />

                <PhoneInput
                  label="Official Contact Phone"
                  value={formData.contactPhone}
                  onChange={(contactPhone) =>
                    setFormData((prev) => ({ ...prev, contactPhone }))
                  }
                  required
                />
              </div>

              {/* Principal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Institution Administrator / Principal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. A. Ramanathan"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRegisterModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Registering..." : "Register Institution"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
