"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Layers,
  Building2,
  GraduationCap,
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";

interface InstitutionRef {
  _id: string;
  name: string;
  code: string;
}

interface DepartmentItem {
  _id: string;
  institutionId: InstitutionRef | string;
  name: string;
  code: string;
  hodName?: string;
  studentCount?: number;
  courseCount?: number;
  createdAt?: string;
}

interface CurrentUser {
  userId: string;
  email: string;
  role: string;
  institutionId?: string;
  institutionName?: string;
}

// Instant local department code generator
function generateLocalDeptCode(name: string): string {
  const cleanName = name.trim().toUpperCase();
  if (!cleanName) return "";

  const commonMap: Record<string, string> = {
    "COMPUTER SCIENCE": "CSE",
    "COMPUTER SCIENCE & ENGINEERING": "CSE",
    "COMPUTER SCIENCE AND ENGINEERING": "CSE",
    "COMPUTER SCIENCE AND BUSINESS SYSTEMS": "CSBS",
    "COMPUTER SCIENCE & BUSINESS SYSTEMS": "CSBS",
    "INFORMATION TECHNOLOGY": "IT",
    "ELECTRONICS & COMMUNICATION": "ECE",
    "ELECTRONICS AND COMMUNICATION": "ECE",
    "ELECTRONICS & COMMUNICATION ENGINEERING": "ECE",
    "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
    "ELECTRICAL & ELECTRONICS": "EEE",
    "ELECTRICAL AND ELECTRONICS": "EEE",
    "ELECTRICAL & ELECTRONICS ENGINEERING": "EEE",
    "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
    "MECHANICAL": "MECH",
    "MECHANICAL ENGINEERING": "MECH",
    "CIVIL": "CIVIL",
    "CIVIL ENGINEERING": "CIVIL",
    "ARTIFICIAL INTELLIGENCE": "AI",
    "ARTIFICIAL INTELLIGENCE & DATA SCIENCE": "AIDS",
    "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE": "AIDS",
    "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "AIML",
    "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AIML",
    "DATA SCIENCE": "DS",
    "CYBER SECURITY": "CYBER",
    "CYBERSECURITY": "CYBER",
    "BIOMEDICAL": "BME",
    "BIOMEDICAL ENGINEERING": "BME",
    "BIOTECHNOLOGY": "BIOTECH",
    "CHEMICAL ENGINEERING": "CHEM",
    "AERONAUTICAL ENGINEERING": "AERO",
    "AEROSPACE ENGINEERING": "AERO",
    "AUTOMOBILE ENGINEERING": "AUTO",
    "MECHATRONICS": "MTRX",
    "MECHATRONICS ENGINEERING": "MTRX",
    "TAMIL": "TAM",
    "ENGLISH": "ENG",
    "MATHEMATICS": "MATH",
    "MATHS": "MATH",
    "PHYSICS": "PHY",
    "CHEMISTRY": "CHEM",
    "BOTANY": "BOT",
    "ZOOLOGY": "ZOO",
    "COMMERCE": "COM",
    "ECONOMICS": "ECO",
    "HISTORY": "HIST",
    "GEOGRAPHY": "GEO",
    "PSYCHOLOGY": "PSY",
    "SOCIOLOGY": "SOC",
    "POLITICAL SCIENCE": "POL",
    "BUSINESS ADMINISTRATION": "BBA",
    "MANAGEMENT STUDIES": "MBA",
    "COMPUTER APPLICATIONS": "BCA",
    "MASTER OF COMPUTER APPLICATIONS": "MCA",
  };

  if (commonMap[cleanName]) {
    return commonMap[cleanName];
  }

  if (/^[A-Z0-9]{2,6}$/.test(cleanName)) {
    return cleanName;
  }

  const words = cleanName
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ")
    .split(/\s+/)
    .filter((w) => !["AND", "OF", "THE", "IN", "FOR", "TO", "DEPARTMENT", "DEPT"].includes(w));

  if (words.length > 1) {
    const acronym = words.map((w) => w.charAt(0)).join("");
    if (acronym.length >= 2) {
      return acronym.slice(0, 6);
    }
  }

  if (cleanName.length <= 5) {
    return cleanName.replace(/[^A-Z0-9]/g, "");
  }

  return cleanName.replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionRef[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedInstFilter, setSelectedInstFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeDept, setActiveDept] = useState<DepartmentItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    institutionId: "",
    name: "",
    code: "",
    hodName: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const suggestDeptCode = useCallback(async (instId: string, name?: string, force = false) => {
    if (!instId) return;
    setGeneratingCode(true);
    try {
      const url = name && name.trim().length > 0
        ? `/api/departments/next-code?institutionId=${instId}&name=${encodeURIComponent(name.trim())}`
        : `/api/departments/next-code?institutionId=${instId}`;
      const res = await fetch(url).then((r) => r.json());
      if (res?.success && res.data?.nextCode) {
        setFormData((prev) => {
          if (force || !isCodeManuallyEdited || !prev.code) {
            return { ...prev, code: res.data.nextCode };
          }
          return prev;
        });
      }
    } catch (e) {
      console.error("Failed to suggest department code:", e);
    } finally {
      setGeneratingCode(false);
    }
  }, [isCodeManuallyEdited]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 4000);
    return () => clearTimeout(t);
  }, [successToast]);

  // Load user session
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && res.data) {
          setCurrentUser(res.data);
          if (res.data.institutionId) {
            setFormData((prev) => ({ ...prev, institutionId: res.data.institutionId }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch departments and institutions
  const fetchData = useCallback(async () => {
    try {
      const [deptRes, instRes] = await Promise.all([
        fetch("/api/departments?includeCounts=true").then((r) => r.json()),
        fetch("/api/institutions?limit=100").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (deptRes?.success && Array.isArray(deptRes.data?.departments)) {
        setDepartments(deptRes.data.departments);
      }
      if (instRes?.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
      }
    } catch (e) {
      console.error("Failed to load departments data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filtered list
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const instId = typeof d.institutionId === "object" ? d.institutionId?._id : d.institutionId;
      const matchInst = selectedInstFilter === "ALL" || instId === selectedInstFilter;

      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.hodName && d.hodName.toLowerCase().includes(q));

      return matchInst && matchQuery;
    });
  }, [departments, search, selectedInstFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / PAGE_SIZE));
  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDepartments.slice(start, start + PAGE_SIZE);
  }, [filteredDepartments, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedInstFilter]);

  // KPI Calculations
  const totalDepts = departments.length;
  const uniqueInstitutions = new Set(
    departments.map((d) => (typeof d.institutionId === "object" ? d.institutionId?._id : d.institutionId)).filter(Boolean)
  ).size;
  const activeHods = departments.filter((d) => d.hodName && d.hodName.trim().length > 0).length;
  const totalStudents = departments.reduce((acc, d) => acc + (d.studentCount || 0), 0);

  // Handle Create
  const handleOpenAdd = () => {
    setFormError(null);
    setIsCodeManuallyEdited(false);
    const instId = currentUser?.institutionId || institutions[0]?._id || "";
    setFormData({
      institutionId: instId,
      name: "",
      code: "",
      hodName: "",
    });
    setShowAddModal(true);
    if (instId) {
      suggestDeptCode(instId, "", true);
    }
  };

  // If modal is open and institution becomes available, auto-fill code
  useEffect(() => {
    if (showAddModal && !formData.institutionId && institutions.length > 0) {
      const firstId = institutions[0]._id;
      setFormData((prev) => ({ ...prev, institutionId: firstId }));
      suggestDeptCode(firstId, formData.name, true);
    }
  }, [showAddModal, institutions, formData.institutionId, formData.name, suggestDeptCode]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to create department");
        setFormSubmitting(false);
        return;
      }

      setSuccessToast(`Department "${formData.name}" (${formData.code.toUpperCase()}) created successfully.`);
      setShowAddModal(false);
      fetchData();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit
  const handleOpenEdit = (dept: DepartmentItem) => {
    setFormError(null);
    setActiveDept(dept);
    setFormData({
      institutionId: typeof dept.institutionId === "object" ? dept.institutionId._id : dept.institutionId,
      name: dept.name,
      code: dept.code,
      hodName: dept.hodName || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDept) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/departments/${activeDept._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          hodName: formData.hodName,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to update department");
        setFormSubmitting(false);
        return;
      }

      setSuccessToast(`Department "${formData.name}" updated successfully.`);
      setShowEditModal(false);
      setActiveDept(null);
      fetchData();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleOpenDelete = (dept: DepartmentItem) => {
    setFormError(null);
    setActiveDept(dept);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!activeDept) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/departments/${activeDept._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to delete department");
        setFormSubmitting(false);
        return;
      }

      setSuccessToast(`Department "${activeDept.name}" deleted successfully.`);
      setShowDeleteModal(false);
      setActiveDept(null);
      fetchData();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-900/90 backdrop-blur-md px-5 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>Academic Disciplinary Framework</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Academic Departments Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic disciplines, faculty HOD leadership, and linked student enrollment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="cursor-pointer gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </Button>

          {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "INSTITUTION_ADMIN") && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              className="cursor-pointer gap-1.5 shadow-md shadow-emerald-700/20"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiStatCard
          label="Total Departments"
          value={totalDepts}
          subtext="Active disciplines cataloged"
          icon={Layers}
          theme="emerald"
        />
        <KpiStatCard
          label="Institutions Covered"
          value={uniqueInstitutions}
          subtext="Colleges with active departments"
          icon={Building2}
          theme="indigo"
        />
        <KpiStatCard
          label="Assigned HODs"
          value={activeHods}
          subtext="Department faculty heads"
          icon={UserCheck}
          theme="amber"
        />
        <KpiStatCard
          label="Enrolled Students"
          value={totalStudents.toLocaleString()}
          subtext="Across all disciplines"
          icon={GraduationCap}
          theme="default"
        />
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by department name, code, or HOD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
          />
        </div>

        {/* Institution Filter (For Super Admin or Multi-Institution views) */}
        {currentUser?.role === "SUPER_ADMIN" && institutions.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedInstFilter}
              onChange={(e) => setSelectedInstFilter(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition cursor-pointer"
            >
              <option value="ALL">All Institutions ({institutions.length})</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Departments Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-r-transparent mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading academic departments registry...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No departments found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedInstFilter !== "ALL"
                ? "Try clearing your search query or changing the institution filter."
                : "No academic departments have been created yet. Click 'Add Department' to create the first one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Department Name</th>
                  <th className="px-5 py-3.5">Institution</th>
                  <th className="px-5 py-3.5">Head of Department</th>
                  <th className="px-5 py-3.5 text-center">Enrolled Students</th>
                  <th className="px-5 py-3.5 text-center">Programs</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDepartments.map((dept) => {
                  const inst = typeof dept.institutionId === "object" ? dept.institutionId : null;
                  return (
                    <tr
                      key={dept._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Code Badge */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-xs">
                          {dept.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {dept.name}
                        </div>
                      </td>

                      {/* Institution */}
                      <td className="px-5 py-4">
                        {inst ? (
                          <div>
                            <p className="font-medium text-slate-800">{inst.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Code: {inst.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Global / Not Specified</span>
                        )}
                      </td>

                      {/* HOD */}
                      <td className="px-5 py-4">
                        {dept.hodName ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {dept.hodName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700">{dept.hodName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Student Count */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <GraduationCap className="h-3 w-3 text-slate-500" />
                          {dept.studentCount || 0}
                        </span>
                      </td>

                      {/* Course / Program Count */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md text-[11px]">
                          <BookOpen className="h-3 w-3 text-slate-400" />
                          {dept.courseCount || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(dept)}
                            title="Edit Department"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(dept)}
                            title="Delete Department"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/50">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {filteredDepartments.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * PAGE_SIZE, filteredDepartments.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-800">{filteredDepartments.length}</span> departments
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
                <span className="px-3 py-1 text-slate-600 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
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

      {/* Modal: Add Department */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  Add Academic Department
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Register a new academic discipline under the institution.
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
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {/* Institution Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Institution <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={currentUser?.role === "INSTITUTION_ADMIN"}
                  value={formData.institutionId}
                  onChange={(e) => {
                    const newInstId = e.target.value;
                    setFormData((prev) => ({ ...prev, institutionId: newInstId }));
                    if (newInstId && !isCodeManuallyEdited) {
                      suggestDeptCode(newInstId, formData.name, true);
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select Institution...</option>
                  {institutions.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Department Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Engineering"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      let localCode: string | null = null;
                      if (!isCodeManuallyEdited && newName.trim().length > 0) {
                        localCode = generateLocalDeptCode(newName);
                      }

                      setFormData((prev) => ({
                        ...prev,
                        name: newName,
                        code: (!isCodeManuallyEdited && localCode) ? localCode : prev.code,
                      }));

                      if (formData.institutionId && !isCodeManuallyEdited) {
                        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = setTimeout(() => {
                          suggestDeptCode(formData.institutionId, newName);
                        }, 350);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Dept Code <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      ⚡ Auto
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE"
                      value={formData.code}
                      onChange={(e) => {
                        setIsCodeManuallyEdited(true);
                        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-8 text-xs font-mono font-bold text-slate-900 uppercase focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      title="Re-generate department code"
                      disabled={generatingCode || !formData.institutionId}
                      onClick={() => {
                        setIsCodeManuallyEdited(false);
                        suggestDeptCode(formData.institutionId, formData.name, true);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${generatingCode ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* HOD Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Head of Department (HOD Name) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Senthil Kumar"
                  value={formData.hodName}
                  onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formSubmitting}
                  className="cursor-pointer gap-2"
                >
                  {formSubmitting ? "Creating..." : "Add Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Department */}
      {showEditModal && activeDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Edit Department Details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update department code, title, or HOD leadership.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              {/* Department Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Dept Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 uppercase focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Department Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* HOD Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Head of Department (HOD Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Senthil Kumar"
                  value={formData.hodName}
                  onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formSubmitting}
                  className="cursor-pointer gap-2"
                >
                  {formSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && activeDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 rounded-2xl bg-red-50 border border-red-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Delete Academic Department?
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{activeDept.name} ({activeDept.code})</strong>?
            </p>

            {(activeDept.studentCount ?? 0) > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Cannot delete:</strong> {activeDept.studentCount} student(s) are currently enrolled in this department. You must reassign or remove them first.
              </div>
            )}

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={formSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteSubmit}
                disabled={formSubmitting || (activeDept.studentCount ?? 0) > 0}
                className="cursor-pointer"
              >
                {formSubmitting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
