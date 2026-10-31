"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  GraduationCap,
  Upload,
  Plus,
  RefreshCw,
  Fingerprint,
  UserCheck,
  Building2,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  Mail,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import { maskApaarId } from "@/lib/utils/apaar";

interface Student {
  _id: string;
  registerNumber: string;
  fullName: string;
  gender: string;
  admissionYear: number;
  currentSemester: number;
  academicStatus: string;
  apaarId?: string;
  departmentId?: { _id: string; name: string; code: string } | null;
  institutionId?: { _id: string; name: string; code: string } | null;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  institutionId: string;
}

interface Institution {
  _id: string;
  name: string;
  code: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedInstFilter, setSelectedInstFilter] = useState("All");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination (15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add Student Form State
  const [formData, setFormData] = useState({
    institutionId: "",
    departmentId: "",
    registerNumber: "",
    fullName: "",
    email: "",
    apaarId: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    dateOfBirth: "2004-05-15",
    admissionYear: 2024,
    currentSemester: 1,
    academicStatus: "ACTIVE" as "ACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN",
  });

  const [loadingDepts, setLoadingDepts] = useState(false);
  const [modalDepartments, setModalDepartments] = useState<Department[]>([]);
  const [generatingRollNo, setGeneratingRollNo] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    studentName: string;
    registerNumber: string;
    loginEmail: string;
    temporaryPassword: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-generate next sequential roll number based on institution, department, and admission year
  const autoGenerateRollNo = useCallback(
    async (instId: string, deptId: string, year: number) => {
      if (!instId || !deptId) return;
      setGeneratingRollNo(true);
      try {
        const res = await fetch(
          `/api/students/next-roll-no?institutionId=${instId}&departmentId=${deptId}&admissionYear=${year}`
        ).then((r) => r.json());
        if (res?.success && res.data?.nextRollNo) {
          setFormData((prev) => ({ ...prev, registerNumber: res.data.nextRollNo }));
        }
      } catch (e) {
        console.error("Failed to generate roll number:", e);
      } finally {
        setGeneratingRollNo(false);
      }
    },
    []
  );

  // CSV Import State
  const [csvText, setCsvText] = useState("");
  const [importSelectedInst, setImportSelectedInst] = useState("");
  const [previewResult, setPreviewResult] = useState<{
    validRowCount: number;
    invalidRowCount: number;
    errors: { row: number; column: string; error: string }[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  // Load departments specifically and strictly for the selected institution
  const loadDepartmentsForInstitution = useCallback(async (instId: string) => {
    if (!instId) {
      setModalDepartments([]);
      return;
    }
    setLoadingDepts(true);
    try {
      const res = await fetch(`/api/departments?institutionId=${instId}`).then((r) => r.json());
      if (res?.success) {
        const rawList = Array.isArray(res.data?.departments)
          ? res.data.departments
          : Array.isArray(res.data)
          ? res.data
          : [];

        // Strictly match departments belonging to this institution
        const list: Department[] = rawList.filter((d: any) => {
          const dInstId =
            typeof d.institutionId === "object" && d.institutionId !== null
              ? d.institutionId._id?.toString()
              : d.institutionId?.toString();
          return dInstId === instId;
        });

        setModalDepartments(list);
        setFormData((prev) => {
          const chosenDeptId = list.some((d) => d._id === prev.departmentId)
            ? prev.departmentId
            : (list[0]?._id || "");

          if (chosenDeptId) {
            autoGenerateRollNo(instId, chosenDeptId, prev.admissionYear);
          }

          return {
            ...prev,
            departmentId: chosenDeptId,
          };
        });
      } else {
        setModalDepartments([]);
      }
    } catch (e) {
      console.error("Failed to load departments:", e);
      setModalDepartments([]);
    } finally {
      setLoadingDepts(false);
    }
  }, [autoGenerateRollNo]);

  const handleInstitutionChange = (newInstId: string) => {
    setFormData((prev) => ({ ...prev, institutionId: newInstId, departmentId: "" }));
    setModalDepartments([]);
    if (newInstId) {
      loadDepartmentsForInstitution(newInstId);
    }
  };

  const openAddModal = () => {
    setFormError(null);
    const targetInstId = formData.institutionId || institutions[0]?._id || "";
    setFormData((prev) => ({
      ...prev,
      institutionId: targetInstId,
    }));
    setModalDepartments([]);
    if (targetInstId) {
      loadDepartmentsForInstitution(targetInstId);
    }
    setShowAddModal(true);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (search) params.set("search", search);
      if (selectedInstFilter && selectedInstFilter !== "All") params.set("institutionId", selectedInstFilter);

      const [resStudents, resDepts, resInsts] = await Promise.all([
        fetch(`/api/students?${params}`).then((r) => r.json()),
        fetch(`/api/departments`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/institutions?limit=100`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (resStudents?.success) setStudents(Array.isArray(resStudents.data?.students) ? resStudents.data.students : []);
      if (resDepts?.success) {
        const dList: Department[] = Array.isArray(resDepts.data?.departments)
          ? resDepts.data.departments
          : Array.isArray(resDepts.data)
          ? resDepts.data
          : [];
        setDepartments(dList);
      }
      if (resInsts?.success) {
        const instList = Array.isArray(resInsts.data?.institutions)
          ? resInsts.data.institutions
          : Array.isArray(resInsts.data)
          ? resInsts.data
          : [];
        setInstitutions(instList);
        if (instList.length > 0 && !formData.institutionId) {
          setFormData((prev) => ({ ...prev, institutionId: instList[0]._id }));
          setImportSelectedInst(instList[0]._id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [search, selectedInstFilter, formData.institutionId]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, semesterFilter, statusFilter, selectedInstFilter]);

  // Client Filtered list
  const filteredStudents = useMemo(() => {
    return (Array.isArray(students) ? students : []).filter((s) => {
      const sInstId =
        typeof s.institutionId === "object" && s.institutionId !== null
          ? s.institutionId._id
          : s.institutionId;
      const matchInst =
        selectedInstFilter === "All" || sInstId === selectedInstFilter;
      const matchSemester =
        semesterFilter === "All" || s.currentSemester.toString() === semesterFilter;
      const matchStatus =
        statusFilter === "All" || s.academicStatus === statusFilter;
      return matchInst && matchSemester && matchStatus;
    });
  }, [students, selectedInstFilter, semesterFilter, statusFilter]);

  // Total pages and paginated slice (15 per page)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);



  // KPI calculations
  const totalCount = students.length;
  const apaarCount = students.filter((s) => s.apaarId && s.apaarId !== "—").length;
  const apaarPct = totalCount > 0 ? Math.round((apaarCount / totalCount) * 100) : 0;
  const activeCount = students.filter((s) => s.academicStatus === "ACTIVE").length;
  const deptCount = new Set(students.map((s) => s.departmentId?.name).filter(Boolean)).size;

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (!formData.institutionId) {
        setFormError("Please select an institution.");
        setSubmitting(false);
        return;
      }

      if (!formData.departmentId) {
        setFormError("Please select an academic department.");
        setSubmitting(false);
        return;
      }

      const cleanApaar = formData.apaarId.replace(/\s+/g, "").trim();
      if (cleanApaar && !/^\d{12}$/.test(cleanApaar)) {
        setFormError("APAAR ID must be exactly 12 digits (or leave it blank).");
        setSubmitting(false);
        return;
      }

      if (!formData.dateOfBirth) {
        setFormError("Date of birth is required.");
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        admissionYear: Number(formData.admissionYear),
        currentSemester: Number(formData.currentSemester),
        registerNumber: formData.registerNumber.trim().toUpperCase(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        apaarId: cleanApaar || undefined,
        academicStatus: formData.academicStatus || "ACTIVE",
      };

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        if (data.data?.credentials) {
          setCreatedCredentials({
            studentName: data.data.fullName,
            registerNumber: data.data.registerNumber,
            loginEmail: data.data.credentials.loginEmail,
            temporaryPassword: data.data.credentials.temporaryPassword,
            emailSent: data.data.credentials.emailSent,
            emailError: data.data.credentials.emailError,
          });
        }
        setFormData({
          institutionId: institutions[0]?._id || "",
          departmentId: "",
          registerNumber: "",
          fullName: "",
          email: "",
          apaarId: "",
          gender: "MALE",
          dateOfBirth: "2004-05-15",
          admissionYear: 2024,
          currentSemester: 1,
          academicStatus: "ACTIVE",
        });
        fetchStudents();
      } else {
        const details = data?.error?.details?.fieldErrors;
        if (details) {
          const detailMsgs = Object.entries(details)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
            .join(" | ");
          setFormError(`${data.error?.message || "Validation error"}: ${detailMsgs}`);
        } else {
          setFormError(data?.error?.message || "Failed to create student");
        }
      }
    } catch (err: any) {
      setFormError("Network error occurred: " + (err?.message || "Please check connection"));
    } finally {
      setSubmitting(false);
    }
  }

  // Handle CSV Preview
  async function handleCsvPreview() {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/students/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: csvText,
          institutionId: importSelectedInst || institutions[0]?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewResult(data.data);
      } else {
        alert(data?.error?.message || "Preview failed");
      }
    } finally {
      setImporting(false);
    }
  }

  // Handle CSV Commit
  async function handleCsvCommit() {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/students/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: csvText,
          institutionId: importSelectedInst || institutions[0]?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully imported ${data.data.committedCount} students!`);
        setShowImportModal(false);
        setCsvText("");
        setPreviewResult(null);
        fetchStudents();
      } else {
        alert(data?.error?.message || "Batch commit failed");
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Identity & APAAR Registry
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Master registry of admitted students, masked APAAR IDs, and verification statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setShowImportModal(true)}
            className="shadow-2xs"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </Button>

          <Button
            onClick={openAddModal}
            className="shadow-md shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="TOTAL REGISTERED"
          value={totalCount}
          subtext="Enrolled across technical programs"
          icon={GraduationCap}
          theme="default"
        />
        <KpiStatCard
          label="APAAR ID RECORDED"
          value={`${apaarPct}%`}
          subtext={`${apaarCount} of ${totalCount} students with 12-digit ID`}
          icon={Fingerprint}
          theme="indigo"
        />
        <KpiStatCard
          label="ACTIVE ENROLLED"
          value={activeCount}
          subtext="Currently attending coursework"
          icon={UserCheck}
          theme="emerald"
        />
        <KpiStatCard
          label="DEPARTMENTS ACTIVE"
          value={deptCount || 1}
          subtext="Academic disciplines represented"
          icon={Building2}
          theme="amber"
        />
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
          {/* Search Box */}
          <div className="relative lg:col-span-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or register number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
            />
          </div>

          {/* College / Institution Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedInstFilter}
              onChange={(e) => setSelectedInstFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Institutions ({institutions.length})</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="lg:col-span-2">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Semesters (1 - 8)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s.toString()}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="GRADUATED">Graduated</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          {/* Refresh Action */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={fetchStudents}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs w-full lg:w-auto cursor-pointer"
              title="Refresh Student Records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Loading student registry...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-xs">
              <GraduationCap className="h-7 w-7 opacity-80" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No students found</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              No student records matched your search query. Add students individually or import a batch CSV.
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Student</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
                <Upload className="h-3.5 w-3.5" />
                <span>Import CSV</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Student & Register No</th>
                  <th className="px-4 py-3.5">Institution / College</th>
                  <th className="px-4 py-3.5">Department & Semester</th>
                  <th className="px-4 py-3.5">Masked APAAR ID</th>
                  <th className="px-4 py-3.5">Admission Year</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Student Name & Register Number */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {s.fullName}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {s.registerNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{s.gender.toLowerCase()}</span>
                      </div>
                    </td>

                    {/* Institution / College */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {s.institutionId?.name || "Institution"}
                      </div>
                      <div className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                        {s.institutionId?.code || "INST"}
                      </div>
                    </td>

                    {/* Department & Current Semester */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">
                        {s.departmentId?.name || "Computer Science & Engineering"}
                      </div>
                      <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                        Semester {s.currentSemester}
                      </div>
                    </td>

                    {/* Masked APAAR ID */}
                    <td className="px-4 py-4">
                      {s.apaarId && s.apaarId !== "—" ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-800 border border-indigo-100">
                          <Lock className="h-3 w-3 text-indigo-500" />
                          <span>{s.apaarId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not Allocated</span>
                      )}
                    </td>

                    {/* Admission Year */}
                    <td className="px-4 py-4 text-slate-600 font-medium">
                      Batch of {s.admissionYear}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={s.academicStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Footer (15 items per page) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/50">
              <p>
                Showing <span className="font-semibold text-slate-800">
                  {filteredStudents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </span> to <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)}
                </span> of{" "}
                <span className="font-semibold text-slate-800">{filteredStudents.length}</span> students
                {filteredStudents.length !== students.length && (
                  <span className="text-slate-400"> (filtered from {students.length})</span>
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

      {/* Modal 1: Register Single Student */}
      {/* Modal 1: Register Single Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                  Add New Student
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Register a student into the academic institution and link their APAAR credential.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="mt-5 space-y-4">
              {/* Institution Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Institution <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.institutionId}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                >
                  <option value="">Select Institution...</option>
                  {institutions.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  {loadingDepts && (
                    <span className="text-[11px] text-emerald-600 font-medium animate-pulse">
                      Loading departments...
                    </span>
                  )}
                </div>
                <select
                  required
                  disabled={loadingDepts || !formData.institutionId || modalDepartments.length === 0}
                  value={formData.departmentId}
                  onChange={(e) => {
                    const newDeptId = e.target.value;
                    setFormData((prev) => ({ ...prev, departmentId: newDeptId }));
                    if (newDeptId && formData.institutionId) {
                      autoGenerateRollNo(formData.institutionId, newDeptId, formData.admissionYear);
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {loadingDepts
                      ? "Loading departments for this institution..."
                      : modalDepartments.length === 0
                      ? "No departments registered for this institution"
                      : "Select Department..."}
                  </option>
                  {modalDepartments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {formData.institutionId && modalDepartments.length === 0 && !loadingDepts && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    No departments found for this institution. Please register departments in the Departments directory first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>

                {/* Register Number with Auto-Generated Badge and Refresh */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Register / Roll No <span className="text-red-500">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                      ⚡ Auto-Generated
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24CSE001"
                      value={formData.registerNumber}
                      onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-xs uppercase font-mono font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      title="Regenerate next sequential Roll Number"
                      disabled={generatingRollNo || !formData.institutionId || !formData.departmentId}
                      onClick={() =>
                        autoGenerateRollNo(formData.institutionId, formData.departmentId, formData.admissionYear)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${generatingRollNo ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* APAAR ID */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    APAAR ID (12-Digit Number)
                  </label>
                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="e.g. 9876 5432 1098"
                  value={formData.apaarId}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d\s]/g, "");
                    setFormData({ ...formData, apaarId: cleaned });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Leave blank if the student has not received their 12-digit APAAR ID yet.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Admission Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Admission Year</label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={formData.admissionYear}
                    onChange={(e) => {
                      const newYear = Number(e.target.value);
                      setFormData((prev) => ({ ...prev, admissionYear: newYear }));
                      if (formData.institutionId && formData.departmentId) {
                        autoGenerateRollNo(formData.institutionId, formData.departmentId, newYear);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>

                {/* Current Semester */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={formData.currentSemester}
                    onChange={(e) => setFormData({ ...formData, currentSemester: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>

                {/* Academic Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={formData.academicStatus}
                    onChange={(e) => setFormData({ ...formData, academicStatus: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="TRANSFERRED">Transferred</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20"
                >
                  {submitting ? "Adding Student..." : "Add Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: CSV Batch Import Wizard */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                  Batch Student CSV Import
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Import hundreds of student records at once with automatic APAAR duplicate validation.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewResult(null);
                }}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Institution */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Target Institution
              </label>
              <select
                value={importSelectedInst}
                onChange={(e) => setImportSelectedInst(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                {institutions.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            {/* CSV Template Hint */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Required CSV Columns:</p>
              <code className="mt-1 block font-mono text-[11px] text-indigo-700 break-all">
                registerNumber,fullName,email,departmentCode,admissionYear,currentSemester,gender,dateOfBirth,apaarId
              </code>
            </div>

            {/* CSV Content Input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Paste CSV Data or Drag File
              </label>
              <textarea
                rows={6}
                placeholder="Paste CSV rows here or drop file..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* Live Preview Results */}
            {previewResult && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700">{previewResult.validRowCount}</p>
                    <p className="text-xs text-emerald-600">Valid Rows Ready to Commit</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                    <p className="text-xl font-bold text-amber-700">{previewResult.invalidRowCount}</p>
                    <p className="text-xs text-amber-600">Conflict / Invalid Rows</p>
                  </div>
                </div>

                {previewResult.errors.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 max-h-40 overflow-y-auto space-y-1">
                    <p className="text-xs font-bold text-red-800">Errors Detected:</p>
                    {previewResult.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-red-700">
                        Row {err.row} [{err.column}]: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCsvText(
                    "registerNumber,fullName,email,departmentCode,admissionYear,currentSemester,gender,dateOfBirth,apaarId\n" +
                    "22CSE102,Kavitha Raman,kavitha@citchennai.edu.in,CSE,2022,4,FEMALE,2004-03-21,987654321099\n" +
                    "22CSE103,Deepak Sharma,deepak@citchennai.edu.in,CSE,2022,4,MALE,2004-07-12,987654321100"
                  );
                }}
              >
                Load Sample Rows
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCsvPreview}
                  disabled={importing || !csvText.trim()}
                >
                  {importing ? "Validating..." : "Preview CSV"}
                </Button>

                <Button
                  type="button"
                  onClick={handleCsvCommit}
                  disabled={importing || !previewResult || previewResult.validRowCount === 0}
                >
                  {importing ? "Importing..." : `Commit ${previewResult?.validRowCount || 0} Students`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Student Created & Credentials Issued */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Student Account Created!
                  </h2>
                  <p className="text-xs text-slate-500">
                    Login credentials issued & configured.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Email Dispatch Status Badge */}
            <div className="mt-4">
              {createdCredentials.emailSent ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Credentials successfully emailed to <strong>{createdCredentials.loginEmail}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Email note: {createdCredentials.emailError || "Email could not be delivered. Please share credentials manually."}
                  </span>
                </div>
              )}
            </div>

            {/* Credential Details Card */}
            <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Student Name</span>
                <span className="font-bold text-slate-900">{createdCredentials.studentName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Register / Roll No</span>
                <span className="font-mono font-bold text-emerald-700">{createdCredentials.registerNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Login User ID (Email)</span>
                <span className="font-mono font-bold text-slate-900 select-all">{createdCredentials.loginEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Temporary Password</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                className="w-1/2 cursor-pointer gap-1.5"
                onClick={() => {
                  const text = `APAAR Student Login Credentials:\nName: ${createdCredentials.studentName}\nRoll No: ${createdCredentials.registerNumber}\nUsername: ${createdCredentials.loginEmail}\nPassword: ${createdCredentials.temporaryPassword}\nLogin Portal: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy Details"}</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                className="w-1/2 cursor-pointer"
                onClick={() => setCreatedCredentials(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
