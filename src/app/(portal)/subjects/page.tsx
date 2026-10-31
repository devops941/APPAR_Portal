"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Award,
  Upload,
  Download,
  Trash2,
  Edit2,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  GraduationCap,
  FlaskConical,
  BookMarked,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";

export type AicteCategory =
  | "BSC"
  | "ESC"
  | "PCC"
  | "PEC"
  | "OEC"
  | "HSMC"
  | "MC"
  | "PROJ";

export const AICTE_CATEGORIES: AicteCategory[] = [
  "BSC",
  "ESC",
  "PCC",
  "PEC",
  "OEC",
  "HSMC",
  "MC",
  "PROJ",
];

export const AICTE_CATEGORY_DESCRIPTIONS: Record<AicteCategory, string> = {
  PCC: "Professional Core Course (Core Theory & Labs)",
  BSC: "Basic Science Course (Mathematics, Physics, Chemistry)",
  ESC: "Engineering Science Course (Computing, Python, Graphics)",
  PEC: "Professional Elective Course (Discipline Specialization)",
  OEC: "Open Elective Course (Inter-disciplinary)",
  HSMC: "Humanities, Social Sciences & Management",
  MC: "Mandatory Non-Credit Course (Values, Constitution)",
  PROJ: "Project Work, Seminar & Internship",
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PCC: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  BSC: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ESC: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  PEC: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  OEC: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  HSMC: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  MC: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  PROJ: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export interface CurriculumPreset {
  name: string;
  category: AicteCategory;
  L: number;
  T: number;
  P: number;
  credits: number;
  isElective?: boolean;
}

export const AICTE_PRESETS_BY_SEM: Record<number, CurriculumPreset[]> = {
  1: [
    { name: "Matrices and Calculus", category: "BSC", L: 3, T: 1, P: 0, credits: 4 },
    { name: "Engineering Physics", category: "BSC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Engineering Chemistry", category: "BSC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Problem Solving and Python Programming", category: "ESC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Python Programming Laboratory", category: "ESC", L: 0, T: 0, P: 4, credits: 2 },
    { name: "Physics and Chemistry Laboratory", category: "BSC", L: 0, T: 0, P: 4, credits: 2 },
  ],
  2: [
    { name: "Programming in C", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Engineering Graphics", category: "ESC", L: 2, T: 0, P: 4, credits: 4 },
    { name: "C Programming Laboratory", category: "PCC", L: 0, T: 0, P: 4, credits: 2 },
    { name: "Technical English", category: "HSMC", L: 2, T: 0, P: 0, credits: 2 },
    { name: "Basic Electrical & Electronics", category: "ESC", L: 3, T: 0, P: 0, credits: 3 },
  ],
  3: [
    { name: "Data Structures and Algorithms", category: "PCC", L: 3, T: 0, P: 2, credits: 4 },
    { name: "Object Oriented Programming", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Digital Principles & Computer Organization", category: "ESC", L: 3, T: 0, P: 2, credits: 4 },
    { name: "Foundations of Data Science", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Data Structures Laboratory", category: "PCC", L: 0, T: 0, P: 3, credits: 1.5 },
  ],
  4: [
    { name: "Database Management Systems", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Operating Systems", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Design and Analysis of Algorithms", category: "PCC", L: 3, T: 0, P: 2, credits: 4 },
    { name: "Database Management Systems Laboratory", category: "PCC", L: 0, T: 0, P: 3, credits: 1.5 },
    { name: "Operating Systems Laboratory", category: "PCC", L: 0, T: 0, P: 3, credits: 1.5 },
  ],
  5: [
    { name: "Computer Networks", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Compiler Design", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Software Engineering", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Networks Laboratory", category: "PCC", L: 0, T: 0, P: 3, credits: 1.5 },
  ],
  6: [
    { name: "Artificial Intelligence & Machine Learning", category: "PCC", L: 3, T: 0, P: 2, credits: 4 },
    { name: "Web Technology", category: "PCC", L: 3, T: 0, P: 0, credits: 3 },
    { name: "Mobile Application Development", category: "PEC", L: 3, T: 0, P: 0, credits: 3, isElective: true },
  ],
  7: [
    { name: "Cloud Computing & DevOps", category: "PEC", L: 3, T: 0, P: 0, credits: 3, isElective: true },
    { name: "Cyber Security & Cryptography", category: "PEC", L: 3, T: 0, P: 0, credits: 3, isElective: true },
    { name: "Mini Project & Seminar", category: "PROJ", L: 0, T: 0, P: 4, credits: 2 },
  ],
  8: [
    { name: "Project Work & Viva-Voce", category: "PROJ", L: 0, T: 0, P: 20, credits: 10 },
    { name: "Professional Ethics in Engineering", category: "HSMC", L: 2, T: 0, P: 0, credits: 2 },
  ],
};

interface SubjectItem {
  _id: string;
  code: string;
  name: string;
  category?: AicteCategory;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  } | any;
  institutionId?: {
    _id: string;
    name: string;
    code: string;
  } | any;
  academicYear?: string;
  semester: number;
  regulationYear?: string;
  lectureHours?: number;
  tutorialHours?: number;
  practicalHours?: number;
  credits: number;
  internalMarks?: number;
  externalMarks?: number;
  maxMarks?: number;
  type?: "THEORY" | "PRACTICAL" | "PROJECT";
  syllabusOutline?: string;
  isElective?: boolean;
  createdAt?: string;
}

interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
  institutionId?: any;
}

interface InstitutionOption {
  _id: string;
  name: string;
  code: string;
}

export default function SubjectsCurriculumPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Academic Years list (e.g. Current year, next, past 3 years)
  const dynamicAcademicBatches = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const batches: string[] = [];
    for (let y = currentYear + 1; y >= currentYear - 3; y--) {
      batches.push(`${y}-${y + 1}`);
    }
    return batches;
  }, []);

  // Filters & Pagination
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [yearBatchFilter, setYearBatchFilter] = useState("All");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [inspectSubject, setInspectSubject] = useState<SubjectItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  // Form State for Add / Edit (Cascading Hierarchy)
  const [formInstId, setFormInstId] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formAcademicYear, setFormAcademicYear] = useState("");
  const [formYearOfStudy, setFormYearOfStudy] = useState(0);
  const [formSemester, setFormSemester] = useState(0);
  const [formCode, setFormCode] = useState("");
  const [autoCodeMode, setAutoCodeMode] = useState(true);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<AicteCategory | "">("");
  const [formType, setFormType] = useState<"THEORY" | "PRACTICAL" | "PROJECT">("THEORY");
  const [formL, setFormL] = useState(3);
  const [formT, setFormT] = useState(0);
  const [formP, setFormP] = useState(0);
  const [formCredits, setFormCredits] = useState(3);
  const [formInternalMarks, setFormInternalMarks] = useState(40);
  const [formExternalMarks, setFormExternalMarks] = useState(60);
  const [formRegulation, setFormRegulation] = useState("AICTE-2024");
  const [formSyllabus, setFormSyllabus] = useState("");
  const [formIsElective, setFormIsElective] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Batch CSV Upload State
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchParsedData, setBatchParsedData] = useState<any[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<{ success?: string; errors?: string[] } | null>(null);

  // Auto-calculate credits when L, T, P changes
  function updateLtp(l: number, t: number, p: number) {
    setFormL(l);
    setFormT(t);
    setFormP(p);
    const calculated = l + Math.ceil(t / 2) + Math.ceil(p / 2);
    setFormCredits(calculated);
  }

  // Fetch all subjects, departments, and colleges
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSubs, resDepts, resInsts] = await Promise.all([
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/departments").then((r) => r.json()),
        fetch("/api/institutions?limit=100").then((r) => r.json()),
      ]);

      if (resSubs?.success) setSubjects(resSubs.data?.subjects || []);

      if (resInsts?.success) {
        const instList: InstitutionOption[] = resInsts.data?.institutions || [];
        setInstitutions(instList);
      }

      if (resDepts?.success) {
        const dList: DepartmentOption[] = resDepts.data?.departments || [];
        setDepartments(dList);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Cascading departments for selected college in Add Modal
  const modalDepartments = useMemo(() => {
    if (!formInstId) return [];
    return departments.filter((d) => {
      const dInstId =
        typeof d.institutionId === "string"
          ? d.institutionId
          : d.institutionId?._id;
      return dInstId === formInstId;
    });
  }, [departments, formInstId]);

  // Dynamic Examination Semesters based on Year of Study (Dropdown)
  const modalSemesters = useMemo(() => {
    if (formYearOfStudy === 1) return [1, 2];
    if (formYearOfStudy === 2) return [3, 4];
    if (formYearOfStudy === 3) return [5, 6];
    if (formYearOfStudy === 4) return [7, 8];
    return [];
  }, [formYearOfStudy]);

  // Client-Side fallback generator with intelligent department prefix detection
  const generateLocalSubjectCode = useCallback(
    (deptId: string, semNum: number, cat: string, suggestedName?: string) => {
      const targetDept = departments.find((d) => d._id === deptId);
      let prefix = "CS";
      if (targetDept?.code) {
        prefix = targetDept.code.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
        if (prefix === "CSE") prefix = "CS";
      }
      if (cat === "BSC") {
        if (suggestedName && /math|calculus|algebra|statistic/i.test(suggestedName)) prefix = "MA";
        else if (suggestedName && /physic|optics/i.test(suggestedName)) prefix = "PH";
        else if (suggestedName && /chem/i.test(suggestedName)) prefix = "CY";
        else prefix = "BS";
      } else if (cat === "HSMC") {
        prefix = "HS";
      } else if (cat === "ESC" && suggestedName && /python|comput|programm/i.test(suggestedName)) {
        prefix = "GE";
      }

      // Check if existing curriculum uses 4-digit regulation format (e.g. CS3101, MA3151)
      const has4Digit = subjects.some(
        (s) => s.code && new RegExp(`^${prefix}\\d{1}${semNum}\\d{2}$`, "i").test(s.code)
      );

      // Count existing matching subjects
      const matchCount = subjects.filter(
        (s) => s.semester === semNum && s.code.toUpperCase().startsWith(prefix)
      ).length;
      const nextSeq = String(matchCount + 1).padStart(2, "0");
      return has4Digit ? `${prefix}3${semNum}${nextSeq}` : `${prefix}${semNum}${nextSeq}`;
    },
    [departments, subjects]
  );

  // Auto-generate next unique AICTE Subject Code from Server with DB validation
  const autoGenerateSubjectCode = useCallback(
    async (
      deptId: string,
      semNum: number,
      cat: string,
      suggestedName?: string,
      force: boolean = false
    ) => {
      if (!autoCodeMode && !force) return;
      if (!deptId || !semNum) return;

      const fallback = generateLocalSubjectCode(deptId, semNum, cat, suggestedName);
      setFormCode((prev) => (prev ? prev : fallback));

      setGeneratingCode(true);
      try {
        const params = new URLSearchParams({
          departmentId: deptId,
          semester: semNum.toString(),
          category: cat,
        });
        if (suggestedName) params.set("name", suggestedName);

        const res = await fetch(`/api/subjects/next-code?${params.toString()}`);
        const data = await res.json();
        if (data?.success && data.data?.code) {
          setFormCode(data.data.code);
        } else {
          setFormCode(fallback);
        }
      } catch {
        setFormCode(fallback);
      } finally {
        setGeneratingCode(false);
      }
    },
    [autoCodeMode, generateLocalSubjectCode]
  );

  // Apply AICTE Quick-Pick Curriculum Preset
  function handleSelectPreset(preset: CurriculumPreset) {
    setFormName(preset.name);
    setFormCategory(preset.category);
    setFormL(preset.L);
    setFormT(preset.T);
    setFormP(preset.P);
    setFormCredits(preset.credits);
    setFormIsElective(Boolean(preset.isElective));

    if (autoCodeMode && formDeptId && formSemester > 0) {
      autoGenerateSubjectCode(formDeptId, formSemester, preset.category, preset.name, true);
    }
  }

  // When college changes in modal
  function handleModalCollegeChange(newCollegeId: string) {
    setFormInstId(newCollegeId);
    setFormDeptId("");
    setFormCode("");
  }

  // When department changes in modal
  function handleModalDeptChange(newDeptId: string) {
    setFormDeptId(newDeptId);
    if (newDeptId && formSemester > 0 && autoCodeMode) {
      autoGenerateSubjectCode(newDeptId, formSemester, formCategory, formName, true);
    }
  }

  // When Year of Study changes
  function handleYearOfStudyChange(year: number) {
    setFormYearOfStudy(year);
    // Keep semester unselected until chosen from the dropdown
    setFormSemester(0);
    setFormCode("");
  }

  // When Semester changes
  function handleSemesterChange(newSem: number) {
    setFormSemester(newSem);
    if (newSem > 0) {
      setFormYearOfStudy(Math.ceil(newSem / 2));
      if (formDeptId && autoCodeMode) {
        autoGenerateSubjectCode(formDeptId, newSem, formCategory, formName, true);
      }
    } else {
      setFormCode("");
    }
  }

  // When Category changes
  function handleCategoryChange(newCat: AicteCategory) {
    setFormCategory(newCat);
    if (formDeptId && formSemester > 0 && autoCodeMode) {
      autoGenerateSubjectCode(formDeptId, formSemester, newCat, formName, true);
    }
  }

  // Cascading departments for Page Filter Bar
  const filterDepartments = useMemo(() => {
    if (collegeFilter === "All") return departments;
    return departments.filter((d) => {
      const dInstId =
        typeof d.institutionId === "string"
          ? d.institutionId
          : d.institutionId?._id;
      return dInstId === collegeFilter;
    });
  }, [departments, collegeFilter]);

  // Filtered Subject Records
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        !search ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase());

      const recInstId =
        typeof s.institutionId === "string"
          ? s.institutionId
          : s.institutionId?._id;
      const matchCollege = collegeFilter === "All" || recInstId === collegeFilter;

      const recDeptId =
        typeof s.departmentId === "string"
          ? s.departmentId
          : s.departmentId?._id;
      const matchDept = deptFilter === "All" || recDeptId === deptFilter;

      const matchYearBatch =
        yearBatchFilter === "All" || s.academicYear === yearBatchFilter;

      const matchSemester =
        semesterFilter === "All" || s.semester.toString() === semesterFilter;

      const matchCategory =
        categoryFilter === "All" || s.category === categoryFilter;

      return (
        matchSearch &&
        matchCollege &&
        matchDept &&
        matchYearBatch &&
        matchSemester &&
        matchCategory
      );
    });
  }, [
    subjects,
    search,
    collegeFilter,
    deptFilter,
    yearBatchFilter,
    semesterFilter,
    categoryFilter,
  ]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, collegeFilter, deptFilter, yearBatchFilter, semesterFilter, categoryFilter]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / PAGE_SIZE));
  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSubjects.slice(start, start + PAGE_SIZE);
  }, [filteredSubjects, currentPage]);

  // KPI Calculations
  const totalSubjectsCount = subjects.length;
  const pccCount = subjects.filter((s) => s.category === "PCC").length;
  const practicalCount = subjects.filter(
    (s) => s.type === "PRACTICAL" || (s.practicalHours && s.practicalHours > 0)
  ).length;
  const totalDegreeCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  // Open Add Modal
  function handleOpenAddModal() {
    setFormInstId("");
    setFormDeptId("");
    setFormAcademicYear("");
    setFormYearOfStudy(0);
    setFormSemester(0);
    setAutoCodeMode(true);
    setIsCodeManuallyEdited(false);
    setFormCode("");
    setFormName("");
    setFormCategory("");
    setFormType("THEORY");
    setFormL(3);
    setFormT(0);
    setFormP(0);
    setFormCredits(3);
    setFormInternalMarks(40);
    setFormExternalMarks(60);
    setFormRegulation("AICTE-2024");
    setFormSyllabus("");
    setFormIsElective(false);
    setFormError(null);

    setShowAddModal(true);
  }

  // Open Edit Modal
  function handleOpenEditModal(sub: SubjectItem) {
    setSelectedSubject(sub);
    const subInstId =
      typeof sub.institutionId === "string"
        ? sub.institutionId
        : sub.institutionId?._id || "";
    setFormInstId(subInstId);

    const subDeptId =
      typeof sub.departmentId === "string"
        ? sub.departmentId
        : sub.departmentId?._id || "";
    setFormDeptId(subDeptId);

    setFormAcademicYear(sub.academicYear || "2025-2026");
    setFormYearOfStudy(Math.ceil(sub.semester / 2) || 1);
    setFormSemester(sub.semester);
    setFormCode(sub.code);
    setIsCodeManuallyEdited(true);
    setFormName(sub.name);
    setFormCategory(sub.category || "PCC");
    setFormType(sub.type || (sub.practicalHours && sub.practicalHours > 0 ? "PRACTICAL" : "THEORY"));
    setFormL(sub.lectureHours !== undefined ? sub.lectureHours : 3);
    setFormT(sub.tutorialHours !== undefined ? sub.tutorialHours : 0);
    setFormP(sub.practicalHours !== undefined ? sub.practicalHours : 0);
    setFormCredits(sub.credits || 3);
    setFormInternalMarks(sub.internalMarks !== undefined ? sub.internalMarks : 40);
    setFormExternalMarks(sub.externalMarks !== undefined ? sub.externalMarks : 60);
    setFormRegulation(sub.regulationYear || "AICTE-2024");
    setFormSyllabus(sub.syllabusOutline || "");
    setFormIsElective(Boolean(sub.isElective));
    setFormError(null);
    setShowEditModal(true);
  }

  // Submit Add Subject
  async function handleAddSubjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!formInstId) {
      setFormError("Please select a College / Institution from the dropdown.");
      setFormSubmitting(false);
      return;
    }
    if (!formDeptId) {
      setFormError("Please select a Department / Discipline from the dropdown.");
      setFormSubmitting(false);
      return;
    }
    if (!formAcademicYear) {
      setFormError("Please select an Academic Batch / Year from the dropdown.");
      setFormSubmitting(false);
      return;
    }
    if (!formYearOfStudy || formYearOfStudy <= 0) {
      setFormError("Please select a Year of Study from the dropdown.");
      setFormSubmitting(false);
      return;
    }
    if (!formSemester || formSemester <= 0) {
      setFormError("Please select an Examination Semester from the dropdown.");
      setFormSubmitting(false);
      return;
    }
    if (!formCategory) {
      setFormError("Please select an AICTE Model Curriculum Category from the dropdown.");
      setFormSubmitting(false);
      return;
    }
    if (!formCode.trim()) {
      setFormError("Please enter or auto-generate a unique Subject Code.");
      setFormSubmitting(false);
      return;
    }
    if (!formName.trim()) {
      setFormError("Please enter the Course Title.");
      setFormSubmitting(false);
      return;
    }

    const payload = {
      institutionId: formInstId,
      departmentId: formDeptId,
      academicYear: formAcademicYear,
      semester: Number(formSemester),
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory || "PCC",
      lectureHours: Number(formL),
      tutorialHours: Number(formT),
      practicalHours: Number(formP),
      credits: Number(formCredits),
      internalMarks: Number(formInternalMarks),
      externalMarks: Number(formExternalMarks),
      maxMarks: Number(formInternalMarks) + Number(formExternalMarks),
      type: formType || (Number(formP) > 0 ? "PRACTICAL" : "THEORY"),
      regulationYear: formRegulation,
      syllabusOutline: formSyllabus,
      isElective: formIsElective,
    };

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        fetchAllData();
      } else {
        setFormError(data.error?.message || "Failed to create subject");
      }
    } catch {
      setFormError("Network communication error.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // Submit Edit Subject
  async function handleEditSubjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubject) return;

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      institutionId: formInstId,
      departmentId: formDeptId,
      academicYear: formAcademicYear,
      semester: Number(formSemester),
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      lectureHours: Number(formL),
      tutorialHours: Number(formT),
      practicalHours: Number(formP),
      credits: Number(formCredits),
      internalMarks: Number(formInternalMarks),
      externalMarks: Number(formExternalMarks),
      maxMarks: Number(formInternalMarks) + Number(formExternalMarks),
      type: Number(formP) > 0 ? "PRACTICAL" : "THEORY",
      regulationYear: formRegulation,
      syllabusOutline: formSyllabus,
      isElective: formIsElective,
    };

    try {
      const res = await fetch(`/api/subjects/${selectedSubject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowEditModal(false);
        fetchAllData();
      } else {
        setFormError(data.error?.message || "Failed to update subject");
      }
    } catch {
      setFormError("Network communication error.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // Delete Subject
  async function handleDeleteSubject(id: string, code: string) {
    if (!confirm(`Are you sure you want to delete subject "${code}" from the curriculum?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.error?.message || "Failed to delete subject");
      }
    } catch {
      alert("Network error deleting subject.");
    }
  }

  // Parse Batch Syllabus CSV
  function handleBatchFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchFile(file);
    setBatchResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setBatchParsedData(results.data as any[]);
      },
      error: (err) => {
        alert(`Failed to parse CSV: ${err.message}`);
      },
    });
  }

  // Upload Batch Syllabus
  async function handleBatchUploadSubmit() {
    if (batchParsedData.length === 0 || !formDeptId) {
      alert("Please select a target college and department, and provide CSV rows.");
      return;
    }

    setBatchUploading(true);
    setBatchResult(null);

    try {
      const res = await fetch("/api/subjects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: batchParsedData,
          departmentId: formDeptId,
          institutionId: formInstId,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setBatchResult({
          success: `Imported ${data.data?.insertedCount || 0} new subjects, updated ${data.data?.updatedCount || 0} existing subjects.`,
          errors: data.data?.errors,
        });
        fetchAllData();
      } else {
        setBatchResult({ errors: [data.error?.message || "Failed to import subjects"] });
      }
    } catch {
      setBatchResult({ errors: ["Network error during batch syllabus import."] });
    } finally {
      setBatchUploading(false);
    }
  }

  // Download Sample AICTE Model CSV
  function downloadSampleAicteCsv() {
    const sample = `semester,code,name,category,L,T,P,credits,internalMarks,externalMarks,maxMarks\n1,MA3151,Matrices and Calculus,BSC,3,1,0,4,40,60,100\n1,PH3151,Engineering Physics,BSC,3,0,0,3,40,60,100\n1,CY3151,Engineering Chemistry,BSC,3,0,0,3,40,60,100\n1,GE3151,Problem Solving and Python Programming,ESC,3,0,0,3,40,60,100\n1,GE3171,Problem Solving and Python Laboratory,ESC,0,0,4,2,40,60,100\n1,BS3171,Physics and Chemistry Laboratory,BSC,0,0,4,2,40,60,100\n2,CS3251,Programming in C,PCC,3,0,0,3,40,60,100\n2,CS3271,C Programming Laboratory,PCC,0,0,4,2,40,60,100\n3,CS3301,Data Structures & Algorithms,PCC,3,0,2,4,40,60,100\n3,CS3391,Object Oriented Programming,PCC,3,0,0,3,40,60,100\n3,CS3311,Data Structures Laboratory,PCC,0,0,3,1.5,40,60,100`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "AICTE_Model_Curriculum_Sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export Active Curriculum to CSV
  function exportActiveCurriculum() {
    if (filteredSubjects.length === 0) {
      alert("No subjects to export.");
      return;
    }

    const exportRows = filteredSubjects.map((s) => ({
      Institution: s.institutionId?.name || "PSNA",
      Department: s.departmentId?.name || "All",
      AcademicYear: s.academicYear || "2025-2026",
      Semester: s.semester,
      Code: s.code,
      Name: s.name,
      Category: s.category || "PCC",
      L: s.lectureHours || 3,
      T: s.tutorialHours || 0,
      P: s.practicalHours || 0,
      Credits: s.credits,
      CIA_Marks: s.internalMarks || 40,
      ESE_Marks: s.externalMarks || 60,
      Total_Marks: s.maxMarks || 100,
    }));

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AICTE_Curriculum_Catalog_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            AICTE Curriculum & Subject Catalog
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Mandate, classify, and administer semester syllabus blueprints by College, Department, Academic Year, and Semester.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Export Active Curriculum */}
          <Button
            variant="secondary"
            onClick={exportActiveCurriculum}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs text-xs font-semibold cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600 mr-1.5" />
            <span>Export Catalog</span>
          </Button>

          {/* Action 2: Batch Syllabus CSV Import */}
          <Button
            variant="secondary"
            onClick={() => setShowBatchModal(true)}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs text-xs font-semibold cursor-pointer"
          >
            <Upload className="h-4 w-4 text-emerald-600 mr-1.5" />
            <span>Batch Syllabus CSV</span>
          </Button>

          {/* Action 3: Add AICTE Subject */}
          <Button
            onClick={handleOpenAddModal}
            className="shadow-md shadow-indigo-600/30 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Subject</span>
          </Button>
        </div>
      </div>

      {/* Top 4 AICTE KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="TOTAL SUBJECTS"
          value={totalSubjectsCount}
          subtext="Active subjects across batches"
          icon={BookMarked}
          theme="default"
        />
        <KpiStatCard
          label="PROFESSIONAL CORE (PCC)"
          value={pccCount}
          subtext="Core engineering theory courses"
          icon={Award}
          theme="emerald"
        />
        <KpiStatCard
          label="PRACTICAL LABORATORIES"
          value={practicalCount}
          subtext="Hands-on computing & science labs"
          icon={FlaskConical}
          theme="amber"
        />
        <KpiStatCard
          label="ACCREDITED CREDITS"
          value={`${totalDegreeCredits} C`}
          subtext="AICTE Benchmark: 160 Total Credits"
          icon={Sparkles}
          theme="indigo"
        />
      </div>

      {/* Hierarchical Cascading Filter Suite */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        {/* Tier 1: Search, College, Department, Academic Year, Category */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
          {/* 1. Search Bar */}
          <div className="relative lg:col-span-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
            />
          </div>

          {/* 2. College / Institution Filter */}
          <div className="lg:col-span-3">
            <div className="relative">
              <select
                value={collegeFilter}
                onChange={(e) => {
                  setCollegeFilter(e.target.value);
                  setDeptFilter("All");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="All">All Institutions ({institutions.length})</option>
                {institutions.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Department Filter (Cascades to selected College) */}
          <div className="lg:col-span-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Departments ({filterDepartments.length})</option>
              {filterDepartments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Academic Year / Batch Filter */}
          <div className="lg:col-span-2">
            <select
              value={yearBatchFilter}
              onChange={(e) => setYearBatchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Academic Years</option>
              {dynamicAcademicBatches.map((b) => (
                <option key={b} value={b}>
                  {b} {b === "2025-2026" ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Category Filter */}
          <div className="lg:col-span-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="All">AICTE</option>
              {AICTE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={fetchAllData}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs w-full lg:w-auto cursor-pointer"
              title="Refresh Catalog"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tier 2: Year of Study & Semester Quick Navigation Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">
            Study Year:
          </span>

          <button
            onClick={() => setSemesterFilter("All")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer shrink-0 ${
              semesterFilter === "All"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Semesters
          </button>

          {/* Year 1 (Sem 1 & 2) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Yr 1:</span>
            {[1, 2].map((sNum) => (
              <button
                key={sNum}
                onClick={() => setSemesterFilter(sNum.toString())}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  semesterFilter === sNum.toString()
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Sem {sNum}
              </button>
            ))}
          </div>

          {/* Year 2 (Sem 3 & 4) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Yr 2:</span>
            {[3, 4].map((sNum) => (
              <button
                key={sNum}
                onClick={() => setSemesterFilter(sNum.toString())}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  semesterFilter === sNum.toString()
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Sem {sNum}
              </button>
            ))}
          </div>

          {/* Year 3 (Sem 5 & 6) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Yr 3:</span>
            {[5, 6].map((sNum) => (
              <button
                key={sNum}
                onClick={() => setSemesterFilter(sNum.toString())}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  semesterFilter === sNum.toString()
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Sem {sNum}
              </button>
            ))}
          </div>

          {/* Year 4 (Sem 7 & 8) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Yr 4:</span>
            {[7, 8].map((sNum) => (
              <button
                key={sNum}
                onClick={() => setSemesterFilter(sNum.toString())}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  semesterFilter === sNum.toString()
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Sem {sNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Subjects Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Loading curriculum subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-xs">
              <BookOpen className="h-7 w-7 opacity-80" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No curriculum subjects found</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Add your first AICTE subject by selecting College, Department, Year, and Semester.
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleOpenAddModal}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Add First Subject</span>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowBatchModal(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" />
                <span>Import Syllabus CSV</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Subject Code & Regulation</th>
                  <th className="px-4 py-3.5">Course Title & Category</th>
                  <th className="px-4 py-3.5">College & Department</th>
                  <th className="px-4 py-3.5">Academic Year & Sem</th>
                  <th className="px-4 py-3.5 text-center">L-T-P Structure</th>
                  <th className="px-4 py-3.5 text-center">Credits</th>
                  <th className="px-4 py-3.5 text-center">Evaluation (CA/ESE)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedSubjects.map((sub) => {
                  const catStyle =
                    CATEGORY_COLORS[sub.category || "PCC"] || CATEGORY_COLORS.PCC;
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Code & Regulation */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-indigo-700 text-sm group-hover:text-indigo-900 transition-colors">
                          {sub.code}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                          {sub.regulationYear || "AICTE-2024"}
                        </span>
                      </td>

                      {/* Course Title & Category */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{sub.name}</div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {sub.category || "PCC"}
                          </span>
                          {sub.isElective && (
                            <span className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[10px] font-semibold">
                              Elective
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {sub.type || "THEORY"}
                          </span>
                        </div>
                      </td>

                      {/* College & Department */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{sub.institutionId?.name || "PSNA College of Engineering"}</span>
                        </div>
                        <span className="inline-block mt-0.5 font-semibold text-slate-500 text-[11px]">
                          {sub.departmentId?.name || "Computer Science"} ({sub.departmentId?.code || "CSE"})
                        </span>
                      </td>

                      {/* Academic Year & Semester */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-800">{sub.academicYear || "2025-2026"}</div>
                        <span className="inline-block mt-0.5 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/80">
                          Year {Math.ceil(sub.semester / 2)} · Sem {sub.semester}
                        </span>
                      </td>

                      {/* L-T-P Structure */}
                      <td className="px-4 py-4 text-center font-mono text-xs">
                        <span className="font-semibold text-slate-700">
                          {sub.lectureHours !== undefined ? sub.lectureHours : 3} -{" "}
                          {sub.tutorialHours !== undefined ? sub.tutorialHours : 0} -{" "}
                          {sub.practicalHours !== undefined ? sub.practicalHours : 0}
                        </span>
                        <div className="text-[10px] text-slate-400">L - T - P</div>
                      </td>

                      {/* Credits */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200">
                          {sub.credits} C
                        </span>
                      </td>

                      {/* Evaluation Breakdown */}
                      <td className="px-4 py-4 text-center">
                        <div className="font-semibold text-slate-700">
                          {sub.internalMarks !== undefined ? sub.internalMarks : 40} /{" "}
                          {sub.externalMarks !== undefined ? sub.externalMarks : 60}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Max: {sub.maxMarks || 100}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectSubject(sub)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                            title="View Syllabus Outline"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSubject(sub._id, sub.code)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="h-4 w-4" />
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
                  {filteredSubjects.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * PAGE_SIZE, filteredSubjects.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-800">{filteredSubjects.length}</span> subjects
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
                    .map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          currentPage === pNum
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}
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

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD AICTE SUBJECT (Hierarchical Cascading Flow with Auto Code) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[94vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white/95 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Add AICTE Curriculum Subject
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Structured hierarchy: College ➔ Department ➔ Academic Batch ➔ Semester ➔ Subject Code.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="addSubjectForm" onSubmit={handleAddSubjectSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* ── STEPPER PROGRESS INDICATOR ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1">
                {[
                  { num: 1, title: "Affiliation", sub: institutions.find((i) => i._id === formInstId)?.name?.slice(0, 15) || "-- Select College --" },
                  { num: 2, title: "Period", sub: formSemester ? `${formAcademicYear || "Batch"} · Sem ${formSemester}` : "-- Select Period --" },
                  { num: 3, title: "Subject Identity", sub: formCode || "-- Select Identity --" },
                  { num: 4, title: "Credit Scheme", sub: `${formCredits} Credits` },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-center transition hover:bg-white"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                        {step.num}
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">{step.title}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500 font-medium truncate">{step.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── STEP 1: INSTITUTION & DEPARTMENT (CASCADING DROPDOWNS) ── */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                      1
                    </span>
                    <span>Institutional Affiliation & Department Mapping</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Step 1 of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select College Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Select College / Institution <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formInstId}
                      onChange={(e) => handleModalCollegeChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select College / Institution --</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.name} ({inst.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Department Dropdown (Cascades to College) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Select Department / Discipline <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!formInstId}
                      value={formDeptId}
                      onChange={(e) => handleModalDeptChange(e.target.value)}
                      className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none cursor-pointer ${
                        !formInstId ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white text-slate-900"
                      }`}
                    >
                      <option value="">
                        {!formInstId ? "-- Please Select a College First --" : "-- Select Department / Discipline --"}
                      </option>
                      {modalDepartments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── STEP 2: ACADEMIC BATCH & YEAR OF STUDY / SEMESTER (DROPDOWNS) ── */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                      2
                    </span>
                    <span>Academic Batch & Semester of Study</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Step 2 of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  {/* 3. Academic Batch / Year Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Academic Batch / Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Academic Batch / Year --</option>
                      {dynamicAcademicBatches.map((b) => (
                        <option key={b} value={b}>
                          {b} {b === "2025-2026" ? "(Current Academic Batch)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Regulation Scheme */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Regulation Scheme
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AICTE-2024 / Anna Univ R2021"
                      value={formRegulation}
                      onChange={(e) => setFormRegulation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4 & 5. Year of Study and Semester Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Select Year of Study Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Select Year of Study <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formYearOfStudy || ""}
                      onChange={(e) => handleYearOfStudyChange(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Year of Study --</option>
                      <option value="1">Year 1 · Foundation (First Year)</option>
                      <option value="2">Year 2 · Intermediate (Second Year)</option>
                      <option value="3">Year 3 · Core Advanced (Third Year)</option>
                      <option value="4">Year 4 · Capstone & Project (Final Year)</option>
                    </select>
                  </div>

                  {/* Select Examination Semester Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      5. Select Examination Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!formYearOfStudy}
                      value={formSemester || ""}
                      onChange={(e) => handleSemesterChange(Number(e.target.value))}
                      className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none cursor-pointer ${
                        !formYearOfStudy ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white text-slate-900"
                      }`}
                    >
                      <option value="">
                        {!formYearOfStudy ? "-- Please Select Year of Study First --" : "-- Select Examination Semester --"}
                      </option>
                      {modalSemesters.map((sNum) => (
                        <option key={sNum} value={sNum}>
                          Semester {sNum} (Year {formYearOfStudy})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── STEP 3: SUBJECT IDENTIFICATION & AICTE CATEGORY ── */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                      3
                    </span>
                    <span>AICTE Subject Identification & Classification</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Step 3 of 4</span>
                </div>

                {/* Quick-Pick AICTE Recommendations for Current Semester */}
                {formSemester > 0 && AICTE_PRESETS_BY_SEM[formSemester] && AICTE_PRESETS_BY_SEM[formSemester].length > 0 && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        Quick-Pick AICTE Standard Subjects (Sem {formSemester})
                      </span>
                      <span className="text-[10px] text-slate-500">Click to 1-click auto-fill blueprint</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {AICTE_PRESETS_BY_SEM[formSemester].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            formName === preset.name
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                          }`}
                        >
                          <span>{preset.name}</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                              formName === preset.name
                                ? "bg-indigo-700 text-indigo-100"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {preset.category} · {preset.credits}C
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Code with Guaranteed Unique Auto-generation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Subject Code <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {autoCodeMode && formCode ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Sparkles className="h-2.5 w-2.5 text-emerald-600" /> Auto Unique
                          </span>
                        ) : !autoCodeMode ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Manual
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            if (!formDeptId || !formSemester) {
                              alert("Please select College, Department, and Semester first to generate a Subject Code.");
                              return;
                            }
                            if (!autoCodeMode) setAutoCodeMode(true);
                            autoGenerateSubjectCode(formDeptId, formSemester, formCategory, formName, true);
                          }}
                          disabled={generatingCode || !formDeptId || !formSemester}
                          className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Generate Next Sequential Unique Code"
                        >
                          <RefreshCw className={`h-3 w-3 ${generatingCode ? "animate-spin" : ""}`} />
                          <span>Regen</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder={
                          !formDeptId || !formSemester
                            ? "Auto-generates when Dept & Sem are chosen"
                            : "e.g. CS3301"
                        }
                        value={formCode}
                        onChange={(e) => {
                          setFormCode(e.target.value.toUpperCase());
                          setAutoCodeMode(false);
                          setIsCodeManuallyEdited(true);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        {formCode ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {formCode ? "Collision-free in catalog" : "Auto-populates when Dept & Sem are chosen"}
                      </span>
                      {formCode && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextMode = !autoCodeMode;
                            setAutoCodeMode(nextMode);
                            if (nextMode && formDeptId && formSemester) {
                              autoGenerateSubjectCode(formDeptId, formSemester, formCategory, formName, true);
                            }
                          }}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          {autoCodeMode ? "Custom mode" : "Auto mode"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Course Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Course Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Structures and Algorithms"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onBlur={() => {
                        if (autoCodeMode && formName.trim() && formDeptId && formSemester) {
                          autoGenerateSubjectCode(formDeptId, formSemester, formCategory, formName, true);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* AICTE Category & Course Type Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      AICTE Model Curriculum Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formCategory}
                      onChange={(e) => handleCategoryChange(e.target.value as AicteCategory)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select AICTE Curriculum Category --</option>
                      {AICTE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat} - {AICTE_CATEGORY_DESCRIPTIONS[cat]}
                        </option>
                      ))}
                    </select>
                    {formCategory && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                            CATEGORY_COLORS[formCategory]?.bg || "bg-blue-50"
                          } ${CATEGORY_COLORS[formCategory]?.text || "text-blue-700"} ${
                            CATEGORY_COLORS[formCategory]?.border || "border-blue-200"
                          }`}
                        >
                          {formCategory} Active
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {AICTE_CATEGORY_DESCRIPTIONS[formCategory]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Course Delivery Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="THEORY">THEORY - Classroom Lecture / Tutorials</option>
                      <option value="PRACTICAL">PRACTICAL - Laboratory / Studio Course</option>
                      <option value="PROJECT">PROJECT - Project Work / Seminar / Internship</option>
                    </select>
                    <div className="mt-1.5 text-[10px] text-slate-500">
                      {formType === "THEORY"
                        ? "Standard classroom lecture-based course"
                        : formType === "PRACTICAL"
                        ? "Hands-on laboratory or workshop session"
                        : "Capstone project, internship, or mini-project"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STEP 4: L-T-P-C CREDIT ALLOCATION & EVALUATION ── */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                      4
                    </span>
                    <span>L-T-P-C Credit Allocation & Evaluation Scheme</span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-200">
                    Credits = L ({formL}) + ⌈T/2⌉ ({Math.ceil(formT / 2)}) + ⌈P/2⌉ ({Math.ceil(formP / 2)}) = {formCredits} C
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Lecture (L)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formL}
                      onChange={(e) => updateLtp(Number(e.target.value), formT, formP)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Tutorial (T)</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={formT}
                      onChange={(e) => updateLtp(formL, Number(e.target.value), formP)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">Practical (P)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formP}
                      onChange={(e) => updateLtp(formL, formT, Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-indigo-700">Credits (C)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formCredits}
                      onChange={(e) => setFormCredits(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-indigo-300 bg-white px-2 py-1.5 text-center text-xs font-black text-indigo-700"
                    />
                  </div>
                </div>

                {/* Internal / External Marks */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Continuous Assessment (CIA / CA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formInternalMarks}
                      onChange={(e) => setFormInternalMarks(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Semester Exam (ESE)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formExternalMarks}
                      onChange={(e) => setFormExternalMarks(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500">Evaluation Marks Balance:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    formInternalMarks + formExternalMarks === 100
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {formInternalMarks} (CIA) + {formExternalMarks} (ESE) = {formInternalMarks + formExternalMarks} Total Marks {formInternalMarks + formExternalMarks === 100 ? "✓ 100% Balanced" : "(Note: Standard is 100)"}
                  </span>
                </div>
              </div>

              {/* ── LIVE INTERACTIVE SUBJECT BLUEPRINT PREVIEW ── */}
              <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/80 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span>Live Curriculum Blueprint Preview</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                    AICTE Model Ready
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-indigo-700 text-sm tracking-wide bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                        {formCode || (formDeptId && formSemester ? "GENERATING CODE..." : "SELECT DEPT & SEMESTER")}
                      </span>
                      {formCategory ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            CATEGORY_COLORS[formCategory]?.bg || "bg-blue-50"
                          } ${CATEGORY_COLORS[formCategory]?.text || "text-blue-700"} ${
                            CATEGORY_COLORS[formCategory]?.border || "border-blue-200"
                          }`}
                        >
                          {formCategory} · {AICTE_CATEGORY_DESCRIPTIONS[formCategory]?.split("(")[0]}
                        </span>
                      ) : (
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold border bg-slate-100 text-slate-500 border-slate-200">
                          Category Not Selected
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500">
                        {formRegulation || "AICTE-2024"}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {formName || "Untitled Course (Enter Title Above)"}
                    </p>

                    <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>{institutions.find((i) => i._id === formInstId)?.name || "College not selected"}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">
                        {departments.find((d) => d._id === formDeptId)?.name || "Department not selected"}
                      </span>
                      <span>·</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {formAcademicYear || "Batch unselected"} · {formSemester ? `Sem ${formSemester} (Year ${Math.ceil(formSemester / 2)})` : "Semester unselected"}
                      </span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-slate-500 font-medium">L-T-P:</span>
                      <span className="font-bold text-slate-800">
                        {formL}-{formT}-{formP}
                      </span>
                    </div>
                    <span className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs px-3 py-1 shadow-2xs">
                      {formCredits} Credits
                    </span>
                    <span className="text-[10px] text-slate-400">
                      CIA {formInternalMarks} + ESE {formExternalMarks} = {formInternalMarks + formExternalMarks}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Syllabus Outline */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Objectives & Syllabus Outline (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the 5 syllabus units, prerequisites, or learning outcomes..."
                  value={formSyllabus}
                  onChange={(e) => setFormSyllabus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addElective"
                  checked={formIsElective}
                  onChange={(e) => setFormIsElective(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <label htmlFor="addElective" className="text-xs font-medium text-slate-700 cursor-pointer">
                  This course is a Department / Open Elective (Optional choice)
                </label>
              </div>
            </form>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/95 backdrop-blur-xs shrink-0">
              <div className="text-[11px] text-slate-500 font-medium">
                Target: <span className="font-bold text-slate-800">{formCode || "—"}</span> ({formAcademicYear || "Batch unselected"} · {formSemester ? `Sem ${formSemester}` : "Semester unselected"})
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="addSubjectForm"
                  size="sm"
                  disabled={formSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {formSubmitting ? "Saving..." : "Add to Catalog"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 2: EDIT AICTE SUBJECT */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showEditModal && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white/95 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-indigo-600" />
                  Edit Subject: {selectedSubject.code}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Update L-T-P credits, evaluation weightages, and title.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="editSubjectForm" onSubmit={handleEditSubjectSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* College & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College / Institution</label>
                  <select
                    value={formInstId}
                    onChange={(e) => handleModalCollegeChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {modalDepartments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Code & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {dynamicAcademicBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AicteCategory)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {AICTE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* L-T-P & Credits */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">L</label>
                    <input
                      type="number"
                      min={0}
                      value={formL}
                      onChange={(e) => updateLtp(Number(e.target.value), formT, formP)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">T</label>
                    <input
                      type="number"
                      min={0}
                      value={formT}
                      onChange={(e) => updateLtp(formL, Number(e.target.value), formP)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600">P</label>
                    <input
                      type="number"
                      min={0}
                      value={formP}
                      onChange={(e) => updateLtp(formL, formT, Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-indigo-700">Credits</label>
                    <input
                      type="number"
                      value={formCredits}
                      onChange={(e) => setFormCredits(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-indigo-300 bg-white px-2 py-1.5 text-center text-xs font-black text-indigo-700"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CA / Internal</label>
                  <input
                    type="number"
                    value={formInternalMarks}
                    onChange={(e) => setFormInternalMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ESE / External</label>
                  <input
                    type="number"
                    value={formExternalMarks}
                    onChange={(e) => setFormExternalMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </form>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3.5 bg-slate-50/95 shrink-0">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" form="editSubjectForm" size="sm" disabled={formSubmitting}>
                {formSubmitting ? "Saving..." : "Update Subject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 3: BATCH SYLLABUS CSV IMPORT */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white/95 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Batch AICTE Syllabus CSV Upload
                </h2>
                <p className="text-[11px] text-slate-500">
                  Select college & department, then upload complete 8-semester curriculum blueprints.
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* College & Department Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target College <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formInstId}
                    onChange={(e) => handleModalCollegeChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {modalDepartments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample Template Download Banner */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 border border-indigo-200/80 p-3.5">
                <div>
                  <p className="text-xs font-bold text-indigo-900">AICTE Model CSV Template</p>
                  <p className="text-[11px] text-indigo-700">
                    Columns: <code className="bg-white/80 px-1 py-0.5 rounded font-mono">semester, code, name, category, L, T, P, credits</code>
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={downloadSampleAicteCsv}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span>Download Sample</span>
                </Button>
              </div>

              {/* File Upload Box */}
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {batchFile ? batchFile.name : "Select or drag and drop your AICTE syllabus CSV file"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">UTF-8 encoded CSV files up to 5MB</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBatchFileChange}
                  className="mt-3 text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>

              {/* Preview Parsed Rows */}
              {batchParsedData.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-2">
                    Syllabus Preview ({batchParsedData.length} subjects found)
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                        <tr>
                          <th className="p-2">Sem</th>
                          <th className="p-2">Code</th>
                          <th className="p-2">Subject Title</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batchParsedData.slice(0, 8).map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold">{row.semester}</td>
                            <td className="p-2 font-mono font-bold text-indigo-700">{row.code}</td>
                            <td className="p-2 font-medium">{row.name}</td>
                            <td className="p-2 font-semibold">{row.category || "PCC"}</td>
                            <td className="p-2 font-bold">{row.credits} C</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Results */}
              {batchResult?.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{batchResult.success}</span>
                </div>
              )}

              {batchResult?.errors && batchResult.errors.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                  <p className="font-bold">Errors:</p>
                  {batchResult.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3.5 bg-slate-50/95 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setShowBatchModal(false)}>
                Close
              </Button>
              <Button
                onClick={handleBatchUploadSubmit}
                disabled={batchUploading || batchParsedData.length === 0}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {batchUploading ? "Importing..." : `Import ${batchParsedData.length} Subjects`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 4: INSPECT SUBJECT SYLLABUS OUTLINE */}
      {/* ──────────────────────────────────────────────────────────── */}
      {inspectSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-xl max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-white/95 shrink-0">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {inspectSubject.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {inspectSubject.name}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {inspectSubject.institutionId?.name || "PSNA College"} · {inspectSubject.departmentId?.name || "Computer Science"} · Year {Math.ceil(inspectSubject.semester / 2)} (Semester {inspectSubject.semester})
                </p>
              </div>
              <button
                onClick={() => setInspectSubject(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Category</p>
                  <p className="text-base font-black text-slate-800">{inspectSubject.category || "PCC"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">L-T-P</p>
                  <p className="text-base font-black text-slate-800">
                    {inspectSubject.lectureHours || 3}-{inspectSubject.tutorialHours || 0}-{inspectSubject.practicalHours || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-3 border border-indigo-200">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase">Credits</p>
                  <p className="text-base font-black text-indigo-700">{inspectSubject.credits} C</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Evaluation Scheme & Academic Batch
                </p>
                <div className="flex justify-between text-slate-600">
                  <span>Academic Batch / Year:</span>
                  <span className="font-bold text-slate-800">{inspectSubject.academicYear || "2025-2026"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Continuous Internal Assessment (CIA / CA):</span>
                  <span className="font-bold">{inspectSubject.internalMarks || 40} Marks</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>End Semester Examination (ESE):</span>
                  <span className="font-bold">{inspectSubject.externalMarks || 60} Marks</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                  <span>Total Maximum Marks:</span>
                  <span>{inspectSubject.maxMarks || 100} Marks</span>
                </div>
              </div>

              {inspectSubject.syllabusOutline && (
                <div className="rounded-xl border border-slate-200 p-4 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Syllabus Outline
                  </p>
                  <p className="whitespace-pre-line leading-relaxed">{inspectSubject.syllabusOutline}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-100 px-6 py-3.5 bg-slate-50/95 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setInspectSubject(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
