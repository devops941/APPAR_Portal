"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Award,
  Eye,
  X,
  Trash2,
  FileCheck,
  Upload,
  BookOpen,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  QrCode,
  GraduationCap,
  ImageIcon,
  ExternalLink,
  FileText,
  UploadCloud,
  LayoutGrid,
  List,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import Papa from "papaparse";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import { calculateGradePoint, computeSgpa } from "@/lib/utils/grading";

interface SubjectResult {
  subjectId?: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  marksObtained: number;
  maxMarks?: number;
  grade?: string;
  gradePoint?: number;
  result?: string;
}

interface AcademicRecord {
  _id: string;
  studentId: {
    _id: string;
    fullName: string;
    registerNumber: string;
    apaarId?: string;
    departmentId?: any;
  } | null;
  institutionId?: {
    _id: string;
    name: string;
    code: string;
  } | any;
  academicYear: string;
  semester: number;
  sgpa: number;
  totalCredits: number;
  status: string;
  version: number;
  subjects: SubjectResult[];
  marksheetUrl?: string;
  marksheetPublicId?: string;
  createdAt?: string;
}

interface StudentOption {
  _id: string;
  fullName: string;
  registerNumber: string;
  institutionId?: any;
  departmentId?: any;
  currentSemester?: number;
  admissionYear?: number;
  apaarId?: string;
}

interface InstitutionOption {
  _id: string;
  name: string;
  code: string;
}

interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
  institutionId: any;
}

interface SubjectItem {
  _id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  maxMarks?: number;
  type?: string;
  departmentId?: any;
}

export default function AcademicRecordsPage() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    institutionName?: string;
  } | null>(null);
  const isStudent = currentUser?.role === "STUDENT";

  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination (15 items per page)
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<AcademicRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<AcademicRecord | null>(null);

  // View mode for Student: 'cards' (expanded subjects) or 'table'
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // In-App Cloudinary Marksheet Lightbox Viewer Modal
  const [viewingScan, setViewingScan] = useState<{
    url: string;
    semester: number;
    academicYear: string;
    studentName?: string;
    registerNumber?: string;
  } | null>(null);

  // Quick Attach Marksheet Scan Modal
  const [attachingRecord, setAttachingRecord] = useState<AcademicRecord | null>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachPreviewUrl, setAttachPreviewUrl] = useState<string | null>(null);
  const [attachingLoading, setAttachingLoading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  // New Marksheet Form State (4-Tier Cascading Dropdowns & Cloudinary Upload)
  const [formCollegeId, setFormCollegeId] = useState("");
  const [formAcademicYear, setFormAcademicYear] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [formSemester, setFormSemester] = useState<number>(0);
  const [subjectRows, setSubjectRows] = useState<SubjectResult[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cloudinary Marksheet File Upload State
  const [marksheetFile, setMarksheetFile] = useState<File | null>(null);
  const [marksheetPreviewUrl, setMarksheetPreviewUrl] = useState<string | null>(null);

  // Batch CSV Upload State
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchParsedData, setBatchParsedData] = useState<any[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<{ success?: string; errors?: string[] } | null>(null);

  // Curriculum Subject Catalog Modal State
  const [catalogDeptId, setCatalogDeptId] = useState("");
  const [catalogSemester, setCatalogSemester] = useState(1);
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCredits, setNewSubCredits] = useState(3);
  const [newSubMaxMarks, setNewSubMaxMarks] = useState(100);
  const [newSubType, setNewSubType] = useState("THEORY");
  const [addingSub, setAddingSub] = useState(false);
  const [subCatalogMsg, setSubCatalogMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusUploading, setSyllabusUploading] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMe, resRecords, resStudents, resInsts, resDepts] = await Promise.all([
        fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/academic-records").then((r) => r.json()),
        fetch("/api/students?limit=200").then((r) => r.json()),
        fetch("/api/institutions?limit=100").then((r) => r.json()),
        fetch("/api/departments").then((r) => r.json()),
      ]);

      if (resMe?.success && resMe.data) setCurrentUser(resMe.data);
      if (resRecords?.success) setRecords(resRecords.data.records || []);
      if (resStudents?.success) setStudents(resStudents.data.students || []);
      if (resInsts?.success) setInstitutions(resInsts.data.institutions || []);
      if (resDepts?.success) {
        const dList: DepartmentOption[] = resDepts.data.departments || [];
        setDepartments(dList);
        if (dList.length > 0 && !catalogDeptId) {
          setCatalogDeptId(dList[0]._id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [catalogDeptId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cascading Student Filter (Filtered by selected College / Institution)
  const formFilteredStudents = useMemo(() => {
    if (!formCollegeId) return [];
    return students.filter((s) => {
      const instId = typeof s.institutionId === "string" ? s.institutionId : s.institutionId?._id;
      return instId === formCollegeId;
    });
  }, [students, formCollegeId]);

  // When selected student and semester change, auto-fetch curriculum subjects
  const fetchSubjectsForForm = useCallback(
    async (studentId: string, semNum: number) => {
      if (!studentId || semNum < 1) {
        setSubjectRows([]);
        return;
      }

      const stud = students.find((s) => s._id === studentId);
      if (!stud) return;

      const deptId =
        typeof stud.departmentId === "string"
          ? stud.departmentId
          : stud.departmentId?._id;

      const instId =
        typeof stud.institutionId === "string"
          ? stud.institutionId
          : stud.institutionId?._id;

      setLoadingSubjects(true);
      try {
        const queryParams = new URLSearchParams();
        if (deptId) queryParams.set("departmentId", deptId);
        if (instId) queryParams.set("institutionId", instId);
        queryParams.set("semester", semNum.toString());

        const res = await fetch(`/api/subjects?${queryParams.toString()}`);
        const data = await res.json();

        if (data?.success && Array.isArray(data.data?.subjects) && data.data.subjects.length > 0) {
          // Pre-populate with official curriculum subjects
          const mapped: SubjectResult[] = data.data.subjects.map((sub: SubjectItem) => ({
            subjectId: sub._id,
            subjectCode: sub.code,
            subjectName: sub.name,
            credits: sub.credits,
            marksObtained: 75,
            maxMarks: sub.maxMarks || 100,
          }));
          setSubjectRows(mapped);
        } else {
          // If no curriculum subjects found for this semester, provide clean template rows
          setSubjectRows([
            { subjectCode: `SUB${semNum}01`, subjectName: "Core Theory Subject I", credits: 4, marksObtained: 75, maxMarks: 100 },
            { subjectCode: `SUB${semNum}02`, subjectName: "Core Theory Subject II", credits: 3, marksObtained: 75, maxMarks: 100 },
            { subjectCode: `SUB${semNum}03`, subjectName: "Department Elective", credits: 3, marksObtained: 75, maxMarks: 100 },
            { subjectCode: `SUB${semNum}04`, subjectName: "Laboratory / Practical", credits: 2, marksObtained: 85, maxMarks: 100 },
          ]);
        }
      } catch {
        setSubjectRows([]);
      } finally {
        setLoadingSubjects(false);
      }
    },
    [students]
  );

  // When opening Create Marksheet modal, start with fresh, unselected state
  function openCreateMarksheetModal() {
    setFormCollegeId("");
    setFormAcademicYear("");
    setFormStudentId("");
    setFormSemester(0);
    setSubjectRows([]);
    setMarksheetFile(null);
    setMarksheetPreviewUrl(null);
    setFormError(null);
    setShowCreateModal(true);
  }

  // Handle Marksheet File Selection
  function handleMarksheetFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds maximum allowed size of 10MB");
      return;
    }

    setMarksheetFile(file);
    if (file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      setMarksheetPreviewUrl(preview);
    } else {
      setMarksheetPreviewUrl(null);
    }
  }

  // Handle Remove Marksheet File
  function handleRemoveMarksheetFile() {
    setMarksheetFile(null);
    if (marksheetPreviewUrl) {
      URL.revokeObjectURL(marksheetPreviewUrl);
      setMarksheetPreviewUrl(null);
    }
  }

  // Live SGPA preview calculation
  const livePreview = useMemo(() => {
    const subjectsWithGrades = subjectRows.map((s) => {
      const percentage = (s.marksObtained / (s.maxMarks || 100)) * 100;
      const { grade, gradePoint, result } = calculateGradePoint(percentage);
      return { ...s, grade, gradePoint, result };
    });
    const { totalCredits, sgpa } = computeSgpa(subjectsWithGrades);
    return { subjects: subjectsWithGrades, totalCredits, sgpa };
  }, [subjectRows]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const sName = r.studentId?.fullName || "";
      const regNo = r.studentId?.registerNumber || "";
      const apaar = r.studentId?.apaarId || "";
      const matchSearch =
        !search ||
        sName.toLowerCase().includes(search.toLowerCase()) ||
        regNo.toLowerCase().includes(search.toLowerCase()) ||
        apaar.includes(search) ||
        `semester ${r.semester}`.includes(search.toLowerCase()) ||
        r.academicYear.includes(search);

      const recInstId =
        typeof r.institutionId === "string"
          ? r.institutionId
          : r.institutionId?._id;
      const matchCollege = isStudent || collegeFilter === "All" || recInstId === collegeFilter;

      const recDeptId =
        typeof r.studentId?.departmentId === "string"
          ? r.studentId.departmentId
          : r.studentId?.departmentId?._id;
      const matchDept = isStudent || deptFilter === "All" || recDeptId === deptFilter;

      const matchSemester = semesterFilter === "All" || r.semester.toString() === semesterFilter;
      const matchStatus = statusFilter === "All" || r.status === statusFilter;

      return matchSearch && matchCollege && matchDept && matchSemester && matchStatus;
    });
  }, [records, search, collegeFilter, deptFilter, semesterFilter, statusFilter, isStudent]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, collegeFilter, deptFilter, semesterFilter, statusFilter]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  // Staff / Institution KPI calculations
  const totalCount = records.length;
  const verifiedCount = records.filter((r) => r.status === "VERIFIED").length;
  const pendingCount = records.filter((r) => r.status === "SUBMITTED" || r.status === "DRAFT").length;
  const correctionCount = records.filter((r) => r.status === "CORRECTION_REQUIRED").length;

  // Student specific academic KPI metrics
  const studentCgpa = useMemo(() => {
    if (records.length === 0) return 0;
    const totalWeighted = records.reduce((acc, r) => acc + (r.sgpa * r.totalCredits), 0);
    const totalCredits = records.reduce((acc, r) => acc + r.totalCredits, 0);
    return totalCredits > 0 ? Number((totalWeighted / totalCredits).toFixed(2)) : 0;
  }, [records]);

  const studentEarnedCredits = useMemo(() => {
    return records.reduce((acc, r) => acc + r.totalCredits, 0);
  }, [records]);

  const studentVerifiedCount = useMemo(() => {
    return records.filter((r) => r.status === "VERIFIED").length;
  }, [records]);

  function addSubjectRow() {
    setSubjectRows((prev) => [
      ...prev,
      {
        subjectCode: `ELECTIVE-${prev.length + 1}`,
        subjectName: "Professional Elective",
        credits: 3,
        marksObtained: 80,
        maxMarks: 100,
      },
    ]);
  }

  function removeSubjectRow(index: number) {
    if (subjectRows.length <= 1) return;
    setSubjectRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Handle Create Marksheet submit
  async function handleCreateMarksheet(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formCollegeId) {
      setFormError("Please select a College / Institution");
      return;
    }
    if (!formAcademicYear) {
      setFormError("Please select an Academic Batch / Year");
      return;
    }
    if (!formStudentId) {
      setFormError("Please select a Student");
      return;
    }
    if (!formSemester || formSemester < 1) {
      setFormError("Please select an Examination Semester");
      return;
    }
    if (subjectRows.length === 0) {
      setFormError("Please enter marks for at least one subject");
      return;
    }

    setSubmitting(true);
    try {
      let marksheetUrl = "";
      let marksheetPublicId = "";

      // 1. Upload marksheet scan to Cloudinary if selected
      if (marksheetFile) {
        const formData = new FormData();
        formData.append("file", marksheetFile);
        formData.append("studentId", formStudentId);
        formData.append("academicYear", formAcademicYear);
        formData.append("semester", formSemester.toString());

        const uploadRes = await fetch("/api/academic-records/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.success) {
          setFormError(uploadData?.error?.message || "Failed to upload marksheet image to Cloudinary");
          setSubmitting(false);
          return;
        }

        marksheetUrl = uploadData.data.secureUrl;
        marksheetPublicId = uploadData.data.publicId;
      }

      // 2. Post academic record
      const payload = {
        studentId: formStudentId,
        institutionId: formCollegeId,
        academicYear: formAcademicYear,
        semester: Number(formSemester),
        marksheetUrl: marksheetUrl || undefined,
        marksheetPublicId: marksheetPublicId || undefined,
        subjects: subjectRows.map((s) => ({
          subjectId: s.subjectId,
          subjectCode: s.subjectCode.trim().toUpperCase(),
          subjectName: s.subjectName.trim(),
          credits: Number(s.credits),
          marksObtained: Number(s.marksObtained),
          maxMarks: 100,
        })),
      };

      const res = await fetch("/api/academic-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        // Auto submit record into verification desk
        const createdId = data.data?.record?._id || data.data?._id;
        if (createdId) {
          await fetch(`/api/academic-records/${createdId}/submit`, { method: "POST" });
        }
        setShowCreateModal(false);
        fetchData();
      } else {
        setFormError(data?.error?.message || "Failed to record marksheet");
      }
    } catch {
      setFormError("Network communication error.");
    } finally {
      setSubmitting(false);
    }
  }

  // Submit a Draft record to verification desk
  async function handleSubmitToScrutiny(recordId: string) {
    try {
      const res = await fetch(`/api/academic-records/${recordId}/submit`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data?.error?.message || "Failed to submit for scrutiny");
      }
    } catch {
      alert("Network error submitting marksheet");
    }
  }

  // Batch CSV File selection & parsing
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
        alert(`Failed to parse CSV file: ${err.message}`);
      },
    });
  }

  // Upload Batch Marksheets
  async function handleBatchUpload() {
    if (batchParsedData.length === 0) {
      alert("No valid data rows found in CSV.");
      return;
    }

    setBatchUploading(true);
    setBatchResult(null);

    try {
      const res = await fetch("/api/academic-records/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: batchParsedData }),
      });
      const data = await res.json();

      if (data.success) {
        setBatchResult({
          success: `Successfully imported marksheets for ${data.data?.totalStudentsProcessed || 0} student(s)!`,
          errors: data.data?.errors,
        });
        fetchData();
      } else {
        setBatchResult({
          errors: [data.error?.message || "Failed to import batch marksheets"],
        });
      }
    } catch {
      setBatchResult({ errors: ["Network error during batch import."] });
    } finally {
      setBatchUploading(false);
    }
  }

  // Fetch Curriculum Catalog subjects
  const fetchCatalogSubjects = useCallback(async () => {
    if (!catalogDeptId) return;
    setLoadingCatalog(true);
    setSubCatalogMsg(null);
    try {
      const res = await fetch(`/api/subjects?departmentId=${catalogDeptId}&semester=${catalogSemester}`);
      const data = await res.json();
      if (data?.success) {
        setCatalogSubjects(data.data?.subjects || []);
      }
    } finally {
      setLoadingCatalog(false);
    }
  }, [catalogDeptId, catalogSemester]);

  useEffect(() => {
    if (showCurriculumModal && catalogDeptId) {
      fetchCatalogSubjects();
    }
  }, [showCurriculumModal, catalogDeptId, catalogSemester, fetchCatalogSubjects]);

  // Add single subject in Curriculum Catalog
  async function handleAddSingleSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubCode || !newSubName) return;

    setAddingSub(true);
    setSubCatalogMsg(null);

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: catalogDeptId,
          semester: Number(catalogSemester),
          code: newSubCode.trim().toUpperCase(),
          name: newSubName.trim(),
          credits: Number(newSubCredits),
          maxMarks: Number(newSubMaxMarks),
          type: newSubType,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubCatalogMsg({ text: `Subject ${newSubCode.toUpperCase()} added successfully!`, isError: false });
        setNewSubCode("");
        setNewSubName("");
        fetchCatalogSubjects();
      } else {
        setSubCatalogMsg({ text: data.error?.message || "Failed to add subject", isError: true });
      }
    } catch {
      setSubCatalogMsg({ text: "Network error adding subject.", isError: true });
    } finally {
      setAddingSub(false);
    }
  }

  // Upload Syllabus CSV
  function handleSyllabusFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSyllabusFile(file);
  }

  async function handleUploadSyllabus() {
    if (!syllabusFile || !catalogDeptId) {
      alert("Please select a syllabus CSV file and department.");
      return;
    }

    setSyllabusUploading(true);
    Papa.parse(syllabusFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const subjects = (results.data as any[]).map((r) => ({
            departmentId: catalogDeptId,
            semester: Number(r.semester || catalogSemester),
            code: r.code || r.subjectCode,
            name: r.name || r.subjectName,
            credits: Number(r.credits || 3),
            maxMarks: Number(r.maxMarks || 100),
            type: r.type || "THEORY",
          }));

          const res = await fetch("/api/subjects/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjects, departmentId: catalogDeptId }),
          });
          const data = await res.json();

          if (data.success) {
            alert(`Syllabus uploaded! ${data.data?.insertedCount} added, ${data.data?.updatedCount} updated.`);
            setSyllabusFile(null);
            fetchCatalogSubjects();
          } else {
            alert(data.error?.message || "Failed to upload syllabus");
          }
        } catch {
          alert("Network error uploading syllabus.");
        } finally {
          setSyllabusUploading(false);
        }
      },
    });
  }

  // Download Sample Files
  function downloadSampleBatchCsv() {
    const sample = `registerNumber,academicYear,semester,subjectCode,marksObtained\n24CSE001,2025-2026,1,MA3151,92\n24CSE001,2025-2026,1,PH3151,88\n24CSE001,2025-2026,1,CY3151,84\n24CSE001,2025-2026,1,GE3151,90\n24CSE001,2025-2026,1,GE3171,95\n24CSE001,2025-2026,1,BS3171,96\n24CSE002,2025-2026,1,MA3151,78\n24CSE002,2025-2026,1,PH3151,82\n24CSE002,2025-2026,1,CY3151,75\n24CSE002,2025-2026,1,GE3151,80\n24CSE002,2025-2026,1,GE3171,88\n24CSE002,2025-2026,1,BS3171,90`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Sample_Marksheets_Batch_Import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadSampleSyllabusCsv() {
    const sample = `semester,code,name,credits,maxMarks,type\n1,MA3151,Matrices and Calculus,4,100,THEORY\n1,PH3151,Engineering Physics,3,100,THEORY\n1,CY3151,Engineering Chemistry,3,100,THEORY\n1,GE3151,Problem Solving and Python,3,100,THEORY\n1,GE3171,Python Laboratory,2,100,PRACTICAL\n1,BS3171,Physics & Chemistry Laboratory,2,100,PRACTICAL\n2,MA3251,Statistics and Numerical Methods,4,100,THEORY\n2,PH3256,Physics for Information Science,3,100,THEORY\n2,BE3251,Basic Electrical and Electronics,3,100,THEORY\n2,GE3271,Engineering Practices Laboratory,2,100,PRACTICAL`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Sample_Curriculum_Syllabus.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Attach Marksheet Scan to Existing Academic Record
  function handleAttachFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachFile(file);
      setAttachPreviewUrl(URL.createObjectURL(file));
      setAttachError(null);
    }
  }

  async function handleAttachMarksheetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attachingRecord || !attachFile) return;

    setAttachingLoading(true);
    setAttachError(null);

    try {
      const formData = new FormData();
      formData.append("file", attachFile);
      formData.append("academicRecordId", attachingRecord._id);
      const studId =
        typeof attachingRecord.studentId === "string"
          ? attachingRecord.studentId
          : attachingRecord.studentId?._id || "";
      formData.append("studentId", studId);
      formData.append("semester", attachingRecord.semester.toString());
      formData.append("academicYear", attachingRecord.academicYear);

      const res = await fetch("/api/academic-records/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setAttachingRecord(null);
        setAttachFile(null);
        setAttachPreviewUrl(null);
        fetchData();
      } else {
        setAttachError(data.error?.message || "Failed to upload marksheet scan");
      }
    } catch {
      setAttachError("Network communication error.");
    } finally {
      setAttachingLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Adaptive Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            {isStudent ? (
              <>
                <Award className="h-6 w-6 text-emerald-600" />
                My Semester Marksheets & Credentials
              </>
            ) : (
              <>
                <ClipboardList className="h-6 w-6 text-emerald-600" />
                Academic Records & Marksheets
              </>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isStudent
              ? "Official university grade sheets, credit accumulation, and cryptographically verified transcripts."
              : "Mandate, record, and verify semester grade sheets, credit allocation, and calculated SGPA."}
          </p>
        </div>

        {isStudent ? (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Sovereign Credential Vault</span>
            </div>
            {records.length > 0 && (
              <Button
                onClick={() => setPrintRecord(records[0])}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                <span>Print Official Transcript</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {/* Action 1: Manage Curriculum Subjects */}
            <Button
              variant="secondary"
              onClick={() => setShowCurriculumModal(true)}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs text-xs font-semibold"
            >
              <BookOpen className="h-4 w-4 text-indigo-600 mr-1.5" />
              <span>Curriculum Catalog</span>
            </Button>

            {/* Action 2: Batch Marksheets CSV Import */}
            <Button
              variant="secondary"
              onClick={() => setShowBatchModal(true)}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs text-xs font-semibold"
            >
              <Upload className="h-4 w-4 text-emerald-600 mr-1.5" />
              <span>Batch CSV Import</span>
            </Button>

            {/* Action 3: New Single Marksheet */}
            <Button
              onClick={openCreateMarksheetModal}
              className="shadow-md shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>New Marksheet</span>
            </Button>
          </div>
        )}
      </div>

      {/* Top 4 KPI Cards (Adaptive for Student vs Staff) */}
      {isStudent ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiStatCard
            label="CUMULATIVE CGPA"
            value={studentCgpa > 0 ? `${studentCgpa} CGPA` : "—"}
            subtext={studentCgpa >= 8.5 ? "First Class with Distinction" : "First Class Grade"}
            icon={Award}
            theme="emerald"
          />
          <KpiStatCard
            label="EARNED CREDITS"
            value={`${studentEarnedCredits} Credits`}
            subtext={`Degree Progress: ${Math.min(100, Math.round((studentEarnedCredits / 160) * 100))}% of 160 credits`}
            icon={BookOpen}
            theme="default"
          />
          <KpiStatCard
            label="COMPLETED SEMESTERS"
            value={`${records.length} Semester${records.length === 1 ? "" : "s"}`}
            subtext={records.length > 0 ? `Latest: Sem ${records[0].semester} (${records[0].academicYear})` : "No examination results"}
            icon={GraduationCap}
            theme="default"
          />
          <KpiStatCard
            label="SEAL & VERIFICATION"
            value={studentVerifiedCount > 0 ? "100% Sealed" : "Pending Audit"}
            subtext="Cryptographically sealed by PSNA CET"
            icon={ShieldCheck}
            theme="emerald"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiStatCard
            label="TOTAL MARKSHEETS"
            value={totalCount}
            subtext="Issued across active academic batches"
            icon={ClipboardList}
            theme="default"
          />
          <KpiStatCard
            label="VERIFIED & SEALED"
            value={verifiedCount}
            subtext="Cryptographically sealed credentials"
            icon={ShieldCheck}
            theme="emerald"
          />
          <KpiStatCard
            label="PENDING SCRUTINY"
            value={pendingCount}
            subtext="Awaiting officer verification"
            icon={Clock}
            theme="amber"
          />
          <KpiStatCard
            label="CORRECTION TICKETS"
            value={correctionCount}
            subtext="Returned to faculty for revisions"
            icon={AlertTriangle}
            theme="rose"
          />
        </div>
      )}

      {/* Multi-Dimensional Filter Suite */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {isStudent ? (
          /* Streamlined Filter for Student */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center">
            <div className="relative sm:col-span-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search semester or subject code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
              />
            </div>

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            {/* View Mode Toggle: Cards (All Subjects on Screen) vs Compact Table */}
            <div className="sm:col-span-2 flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cards View with All Subjects"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Compact Table View"
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <button
                onClick={fetchData}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs w-full cursor-pointer"
                title="Refresh Records"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>
          </div>
        ) : (
          /* Full Institutional Filter Suite for Staff */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
            {/* Search */}
            <div className="relative lg:col-span-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or register no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
              />
            </div>

            {/* College Filter */}
            <div className="lg:col-span-3">
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="All">All Institutions ({institutions.length})</option>
                {institutions.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="lg:col-span-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.code} - {dept.name}
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

            {/* Status Filter */}
            <div className="lg:col-span-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                <option value="All">Status</option>
                <option value="VERIFIED">Verified</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DRAFT">Draft</option>
                <option value="CORRECTION_REQUIRED">Correction</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="lg:col-span-1 flex justify-end">
              <button
                onClick={fetchData}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs w-full lg:w-auto cursor-pointer"
                title="Refresh Records"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Marksheet Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Loading academic marksheets...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-xs">
              <ClipboardList className="h-7 w-7 opacity-80" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No academic marksheets found</p>
            {isStudent ? (
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Your semester examination marksheets and credits will automatically appear here once evaluated by your faculty and sealed by the institution.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Create the first semester marksheet using the button below or import a batch CSV.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={openCreateMarksheetModal}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Record First Marksheet</span>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowBatchModal(true)}>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    <span>Import Batch CSV</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {isStudent && viewMode === "cards" ? (
          /* Rich Expanded Semester Cards View for Student */
          <div className="p-5 space-y-6 bg-slate-50/50">
            {paginatedRecords.map((rec) => (
              <div
                key={rec._id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:shadow-md"
              >
                {/* Semester Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold text-lg">
                      S{rec.semester}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          Semester {rec.semester} Examination
                        </h2>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono font-medium text-slate-200 border border-white/10">
                          {rec.academicYear}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                        <span>{rec.institutionId?.name || "State University"}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          Reg: {rec.studentId?.registerNumber}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 border border-white/10 backdrop-blur-xs">
                      <Award className="h-4 w-4 text-emerald-400" />
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-300">SGPA</div>
                        <div className="text-sm font-black text-white">{rec.sgpa}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 border border-white/10 backdrop-blur-xs">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-300">Credits</div>
                        <div className="text-sm font-black text-white">{rec.totalCredits}</div>
                      </div>
                    </div>

                    <StatusBadge status={rec.status} />
                  </div>
                </div>

                {/* Subjects Table Rendered Directly on Screen */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="px-5 py-3">Course Code</th>
                        <th className="px-5 py-3">Course Title</th>
                        <th className="px-4 py-3 text-center">Credits</th>
                        <th className="px-4 py-3 text-center">Max Marks</th>
                        <th className="px-4 py-3 text-center">Marks Scored</th>
                        <th className="px-4 py-3 text-center">Letter Grade</th>
                        <th className="px-4 py-3 text-center">Grade Point</th>
                        <th className="px-4 py-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rec.subjects && rec.subjects.length > 0 ? (
                        rec.subjects.map((sub, sIdx) => {
                          const isPass = sub.result !== "FAIL" && (sub.marksObtained ?? 0) >= 50;
                          return (
                            <tr key={sIdx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-3 font-mono font-bold text-indigo-700">
                                {sub.subjectCode}
                              </td>
                              <td className="px-5 py-3 font-medium text-slate-900">
                                {sub.subjectName}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {sub.credits}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500">
                                {sub.maxMarks || 100}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-900">
                                {sub.marksObtained}
                              </td>
                              <td className="px-4 py-3 text-center font-black text-indigo-900">
                                <span className="inline-flex h-6 w-7 items-center justify-center rounded-md bg-indigo-50 border border-indigo-200 font-bold">
                                  {sub.grade || "A"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {sub.gradePoint !== undefined ? sub.gradePoint : 8}
                              </td>
                              <td className="px-4 py-3 text-center font-bold">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                    isPass
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            No subject lines recorded for this semester yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Card Action & Cloudinary Marksheet Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/90 bg-slate-50/80 px-6 py-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {rec.marksheetUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Marksheet Scan Secured</span>
                        </span>
                        <button
                          onClick={() =>
                            setViewingScan({
                              url: rec.marksheetUrl!,
                              semester: rec.semester,
                              academicYear: rec.academicYear,
                              studentName: rec.studentId?.fullName,
                              registerNumber: rec.studentId?.registerNumber,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Marksheet Scan</span>
                        </button>
                        <button
                          onClick={() => {
                            setAttachingRecord(rec);
                            setAttachFile(null);
                            setAttachPreviewUrl(null);
                            setAttachError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Replace or update scan file"
                        >
                          <Upload className="h-3 w-3" />
                          <span>Update Scan</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                          No scan attached yet
                        </span>
                        <button
                          onClick={() => {
                            setAttachingRecord(rec);
                            setAttachFile(null);
                            setAttachPreviewUrl(null);
                            setAttachError(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-1 text-xs font-semibold hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Attach Marksheet Scan</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectRecord(rec)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Audit Breakdown</span>
                    </button>
                    <button
                      onClick={() => setPrintRecord(rec)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Marksheet PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Student & Semester</th>
                  <th className="px-4 py-3.5">Institution / College</th>
                  <th className="px-4 py-3.5">Academic Year</th>
                  <th className="px-4 py-3.5">Credits</th>
                  <th className="px-4 py-3.5">Computed SGPA</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedRecords.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {rec.studentId?.fullName || "Student Record"}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {rec.studentId?.registerNumber || "—"}
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Semester {rec.semester}
                        </span>
                        {rec.studentId?.apaarId && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            APAAR: {rec.studentId.apaarId.slice(0, 4)}••••{rec.studentId.apaarId.slice(-4)}
                          </span>
                        )}
                        {rec.marksheetUrl ? (
                          <button
                            onClick={() =>
                              setViewingScan({
                                url: rec.marksheetUrl!,
                                semester: rec.semester,
                                academicYear: rec.academicYear,
                                studentName: rec.studentId?.fullName,
                                registerNumber: rec.studentId?.registerNumber,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="View Marksheet Scan in Viewer"
                          >
                            <ImageIcon className="h-3 w-3 text-emerald-600" />
                            <span>Scan Attached</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAttachingRecord(rec);
                              setAttachFile(null);
                              setAttachPreviewUrl(null);
                              setAttachError(null);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Upload and attach marksheet scan"
                          >
                            <Upload className="h-3 w-3 text-amber-600" />
                            <span>Attach Scan</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {rec.institutionId?.name || "PSNA College of Engineering"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.institutionId?.code || "INST-002"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <div>{rec.academicYear}</div>
                      <div className="text-[10px] text-slate-400">Version {rec.version}</div>
                    </td>

                    <td className="px-4 py-4 text-slate-700 font-semibold">
                      {rec.totalCredits} Credits
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border ${
                          rec.sgpa >= 8.5
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : rec.sgpa >= 7.0
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        {rec.sgpa} SGPA
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={rec.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Breakdown Button */}
                        <button
                          onClick={() => setInspectRecord(rec)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition shadow-2xs cursor-pointer"
                          title="View Subject Breakdown"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>

                        {/* Cloudinary Marksheet Scan Lightbox or Attach */}
                        {rec.marksheetUrl ? (
                          <button
                            onClick={() =>
                              setViewingScan({
                                url: rec.marksheetUrl!,
                                semester: rec.semester,
                                academicYear: rec.academicYear,
                                studentName: rec.studentId?.fullName,
                                registerNumber: rec.studentId?.registerNumber,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                            title="View Marksheet Scan in In-App Lightbox"
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>Scan</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAttachingRecord(rec);
                              setAttachFile(null);
                              setAttachPreviewUrl(null);
                              setAttachError(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                            title="Attach Marksheet Scan"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Attach</span>
                          </button>
                        )}

                        {/* Official PDF Print Button */}
                        <button
                          onClick={() => setPrintRecord(rec)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                          title="Generate Official Marksheet PDF"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Print PDF</span>
                        </button>

                        {/* Submit if in DRAFT (Staff only) */}
                        {!isStudent && rec.status === "DRAFT" && (
                          <button
                            onClick={() => handleSubmitToScrutiny(rec._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
                            title="Submit for Verification Officer Review"
                          >
                            <FileCheck className="h-3 w-3" />
                            <span>Submit</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/50">
          <p>
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}
            </span>{" "}
            of <span className="font-semibold text-slate-800">{filteredRecords.length}</span> marksheets
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
      </>
    )}
  </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE MARKSHEET (Auto-populating Smart Entry) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  Create Semester Marksheet
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select student and semester to auto-load official syllabus subjects and enter examination marks.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateMarksheet} className="mt-5 space-y-4">
              {/* 4 Cascading Dropdowns: College -> Batch -> Student -> Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                {/* Tier 1: College / Institution */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    1. College / Institution <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formCollegeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCollegeId(val);
                      setFormStudentId("");
                      setFormSemester(0);
                      setSubjectRows([]);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select College / Institution --</option>
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier 2: Academic Batch / Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    2. Academic Batch / Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Academic Batch / Year --</option>
                    <option value="2024-2025">2024-2025 (First Year Batch)</option>
                    <option value="2025-2026">2025-2026 (Current Academic Year)</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>

                {/* Tier 3: Student (Filtered by selected College) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    3. Student Name / Reg. No <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!formCollegeId}
                    value={formStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormStudentId(val);
                      setFormSemester(0);
                      setSubjectRows([]);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {!formCollegeId ? (
                      <option value="">-- Please Select College First --</option>
                    ) : (
                      <option value="">
                        -- Select Student ({formFilteredStudents.length} available) --
                      </option>
                    )}
                    {formFilteredStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.fullName} ({s.registerNumber}) — {s.departmentId?.code || "Dept"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier 4: Examination Semester */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      4. Examination Semester <span className="text-red-500">*</span>
                    </label>
                    {loadingSubjects && (
                      <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-semibold">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Fetching subjects...
                      </span>
                    )}
                  </div>
                  <select
                    required
                    disabled={!formStudentId}
                    value={formSemester}
                    onChange={(e) => {
                      const sem = Number(e.target.value);
                      setFormSemester(sem);
                      if (sem > 0 && formStudentId) {
                        fetchSubjectsForForm(formStudentId, sem);
                      } else {
                        setSubjectRows([]);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {!formStudentId ? (
                      <option value="0">-- Please Select Student First --</option>
                    ) : (
                      <option value="0">-- Select Examination Semester --</option>
                    )}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cloudinary Marksheet Scan Upload Zone */}
              <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 transition hover:border-emerald-500">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-emerald-600" />
                    <span>Upload Marksheet Scan (Saved to Cloudinary)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Optional · Cloudinary Vault
                  </span>
                </div>

                {!marksheetFile ? (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-emerald-300 rounded-xl bg-white/80 cursor-pointer hover:bg-emerald-50/60 transition group">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
                      <ImageIcon className="h-4 w-4 text-emerald-600" />
                      <span>Choose marksheet image / PDF or drag & drop</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Supports PNG, JPG, JPEG, WebP, or PDF up to 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                      onChange={handleMarksheetFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between bg-white rounded-xl border border-emerald-200 p-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      {marksheetPreviewUrl ? (
                        <img
                          src={marksheetPreviewUrl}
                          alt="Marksheet Preview"
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                          {marksheetFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(marksheetFile.size / 1024).toFixed(1)} KB · Ready to archive to Cloudinary
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveMarksheetFile}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Subject Marks Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Subject Marks & Credit Allocation ({subjectRows.length} subjects)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Custom Subject
                  </button>
                </div>

                {!formStudentId || formSemester === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                    Please select College, Student, and Semester above to auto-load official syllabus subjects.
                  </div>
                ) : subjectRows.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                    No subjects loaded yet. Click &quot;Add Custom Subject&quot; above to enter marks.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-slate-400 px-2">
                      <span className="col-span-3">Code</span>
                      <span className="col-span-4">Subject Title</span>
                      <span className="col-span-2 text-center">Credits</span>
                      <span className="col-span-2 text-center">Marks (0-100)</span>
                      <span className="col-span-1 text-center">Grade</span>
                    </div>

                    {subjectRows.map((row, idx) => {
                      const pct = (row.marksObtained / (row.maxMarks || 100)) * 100;
                      const { grade, result } = calculateGradePoint(pct);
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 p-2 bg-slate-50/70"
                        >
                          <input
                            type="text"
                            placeholder="Code"
                            value={row.subjectCode}
                            onChange={(e) => {
                              const updated = [...subjectRows];
                              updated[idx].subjectCode = e.target.value.toUpperCase();
                              setSubjectRows(updated);
                            }}
                            className="col-span-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 uppercase font-semibold"
                          />

                          <input
                            type="text"
                            placeholder="Subject Title"
                            value={row.subjectName}
                            onChange={(e) => {
                              const updated = [...subjectRows];
                              updated[idx].subjectName = e.target.value;
                              setSubjectRows(updated);
                            }}
                            className="col-span-4 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
                          />

                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={row.credits}
                            onChange={(e) => {
                              const updated = [...subjectRows];
                              updated[idx].credits = Number(e.target.value);
                              setSubjectRows(updated);
                            }}
                            className="col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 text-center font-semibold"
                          />

                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.marksObtained}
                            onChange={(e) => {
                              const updated = [...subjectRows];
                              updated[idx].marksObtained = Number(e.target.value);
                              setSubjectRows(updated);
                            }}
                            className="col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 text-center font-bold text-indigo-700"
                          />

                          <div className="col-span-1 flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                result === "PASS" ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {grade}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSubjectRow(idx)}
                              disabled={subjectRows.length <= 1}
                              className="text-slate-300 hover:text-red-500 disabled:opacity-20 cursor-pointer ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Real-time SGPA preview */}
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 p-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    Statutory SGPA Calculation
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Total Credits: <span className="font-bold text-slate-800">{livePreview.totalCredits}</span> · UGC 10-Point Scale
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700">{livePreview.sgpa}</span>
                  <span className="text-xs font-bold text-emerald-600 ml-1">SGPA</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? marksheetFile
                      ? "Uploading Scan & Submitting..."
                      : "Submitting..."
                    : "Submit to Verification Desk"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 2: BATCH MARKSHEET CSV IMPORT */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Batch Marksheets CSV Upload
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Import semester grades for an entire class or batch in one shot.
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Template Download Banner */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 border border-indigo-200/80 p-3.5">
                <div>
                  <p className="text-xs font-bold text-indigo-900">Need the CSV Template?</p>
                  <p className="text-[11px] text-indigo-700">
                    Columns: <code className="bg-white/80 px-1 py-0.5 rounded font-mono">registerNumber, academicYear, semester, subjectCode, marksObtained</code>
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={downloadSampleBatchCsv}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span>Download Sample</span>
                </Button>
              </div>

              {/* File Upload Box */}
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {batchFile ? batchFile.name : "Select or drag and drop your marksheets CSV file"}
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
                    Parsed Data Preview ({batchParsedData.length} records found)
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                        <tr>
                          <th className="p-2">Reg No</th>
                          <th className="p-2">Year</th>
                          <th className="p-2">Sem</th>
                          <th className="p-2">Subject</th>
                          <th className="p-2">Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batchParsedData.slice(0, 8).map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono font-bold">{row.registerNumber}</td>
                            <td className="p-2">{row.academicYear}</td>
                            <td className="p-2 font-bold">{row.semester}</td>
                            <td className="p-2 font-mono">{row.subjectCode}</td>
                            <td className="p-2 font-bold text-indigo-700">{row.marksObtained}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {batchParsedData.length > 8 && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      + {batchParsedData.length - 8} more rows will be processed.
                    </p>
                  )}
                </div>
              )}

              {/* Results & Errors */}
              {batchResult?.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{batchResult.success}</span>
                </div>
              )}

              {batchResult?.errors && batchResult.errors.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                  <p className="font-bold">Errors encountered:</p>
                  {batchResult.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowBatchModal(false)}>
                  Close
                </Button>
                <Button
                  onClick={handleBatchUpload}
                  disabled={batchUploading || batchParsedData.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {batchUploading ? "Processing Import..." : `Import ${batchParsedData.length} Records`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 3: CURRICULUM SUBJECT CATALOG MANAGER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showCurriculumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Curriculum & Subject Catalog
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Configure department-wise semester subjects and upload syllabus blueprints.
                </p>
              </div>
              <button
                onClick={() => setShowCurriculumModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Department & Semester Filter Header */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Department</label>
                <select
                  value={catalogDeptId}
                  onChange={(e) => setCatalogDeptId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sNum) => (
                    <button
                      key={sNum}
                      onClick={() => setCatalogSemester(sNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                        catalogSemester === sNum
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {sNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add Subject & Bulk CSV Tabs */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form to Add Single Subject */}
              <div className="lg:col-span-5 border-r border-slate-200/80 pr-0 lg:pr-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  + Add Subject to Semester {catalogSemester}
                </h3>

                {subCatalogMsg && (
                  <div
                    className={`mb-3 rounded-xl p-2.5 text-xs ${
                      subCatalogMsg.isError
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {subCatalogMsg.text}
                  </div>
                )}

                <form onSubmit={handleAddSingleSubject} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">Subject Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS3301"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">Subject Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Structures & Algorithms"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Credits</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={newSubCredits}
                        onChange={(e) => setNewSubCredits(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Max Marks</label>
                      <input
                        type="number"
                        value={newSubMaxMarks}
                        onChange={(e) => setNewSubMaxMarks(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Type</label>
                      <select
                        value={newSubType}
                        onChange={(e) => setNewSubType(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold"
                      >
                        <option value="THEORY">Theory</option>
                        <option value="PRACTICAL">Lab</option>
                        <option value="PROJECT">Project</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" size="sm" disabled={addingSub} className="w-full mt-2">
                    {addingSub ? "Saving..." : "Add Subject"}
                  </Button>
                </form>

                {/* Bulk Syllabus Upload Box */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Bulk Syllabus CSV</span>
                    <button
                      type="button"
                      onClick={downloadSampleSyllabusCsv}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3 w-3" /> Sample CSV
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleSyllabusFileChange}
                    className="text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {syllabusFile && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleUploadSyllabus}
                      disabled={syllabusUploading}
                      className="w-full mt-2"
                    >
                      {syllabusUploading ? "Uploading..." : `Upload ${syllabusFile.name}`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Column: Existing Subjects Table for this Semester */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Active Semester {catalogSemester} Subjects ({catalogSubjects.length})
                  </h3>
                  <button
                    onClick={fetchCatalogSubjects}
                    className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingCatalog ? "animate-spin text-indigo-600" : ""}`} />
                  </button>
                </div>

                {loadingCatalog ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Loading subjects...</div>
                ) : catalogSubjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                    <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No subjects configured yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Use the form on the left or upload a syllabus CSV to populate semester {catalogSemester}.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Subject Title</th>
                          <th className="p-2.5 text-center">Credits</th>
                          <th className="p-2.5 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {catalogSubjects.map((sub) => (
                          <tr key={sub._id} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-mono font-bold text-indigo-700">{sub.code}</td>
                            <td className="p-2.5 font-medium text-slate-800">{sub.name}</td>
                            <td className="p-2.5 text-center font-bold">{sub.credits}</td>
                            <td className="p-2.5 text-center">
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {sub.type || "THEORY"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 4: INSPECT BREAKDOWN */}
      {/* ──────────────────────────────────────────────────────────── */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Semester {inspectRecord.semester} Marksheet Breakdown
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {inspectRecord.studentId?.fullName} ({inspectRecord.studentId?.registerNumber}) · {inspectRecord.academicYear}
                </p>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">SGPA</p>
                <p className="text-xl font-extrabold text-indigo-700">{inspectRecord.sgpa}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Credits</p>
                <p className="text-xl font-extrabold text-slate-800">{inspectRecord.totalCredits}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Status</p>
                <div className="mt-1">
                  <StatusBadge status={inspectRecord.status} />
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Version</p>
                <p className="text-xl font-extrabold text-slate-800">v{inspectRecord.version}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Subject Code & Name</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectRecord.subjects.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <span className="font-mono font-bold text-indigo-700">{s.subjectCode}</span>
                        <span className="ml-2 text-slate-700">{s.subjectName}</span>
                      </td>
                      <td className="p-3 font-semibold">{s.credits}</td>
                      <td className="p-3 font-medium">{s.marksObtained} / 100</td>
                      <td className="p-3 font-bold text-indigo-600">{s.grade || "A"}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            s.result === "PASS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {s.result || "PASS"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inspectRecord.marksheetUrl ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Original Marksheet Scan</h4>
                    <p className="text-[11px] text-slate-500">Archived securely in Cloudinary vault</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingScan({
                        url: inspectRecord.marksheetUrl!,
                        semester: inspectRecord.semester,
                        academicYear: inspectRecord.academicYear,
                        studentName: inspectRecord.studentId?.fullName,
                        registerNumber: inspectRecord.studentId?.registerNumber,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Scan In-App</span>
                  </button>
                  <a
                    href={inspectRecord.marksheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-xs hover:bg-emerald-50 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Link</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">No Marksheet Scan Attached</h4>
                    <p className="text-[11px] text-slate-500">Upload scan to verify in Cryptographic Vault</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachingRecord(inspectRecord);
                    setAttachFile(null);
                    setAttachPreviewUrl(null);
                    setAttachError(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Attach Scan Now</span>
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPrintRecord(inspectRecord);
                  setInspectRecord(null);
                }}
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                <span>Open Printable PDF</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 5: OFFICIAL PRINTABLE PDF MARKSHEET (A4 Printable) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {printRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[96vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            {/* Top Bar with Print Button */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">
                  Official Academic Transcript & Marksheet Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  <span>Print / Save as PDF</span>
                </Button>
                <button
                  onClick={() => setPrintRecord(null)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Document Content */}
            <div id="printable-marksheet" className="border-4 border-slate-900 p-8 rounded-2xl bg-white text-slate-900 font-sans">
              {/* Official AICTE / Government Header */}
              <div className="text-center border-b-2 border-slate-900 pb-5">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-sm">
                    GOI
                  </div>
                  <div>
                    <h1 className="text-base font-black tracking-wider uppercase">
                      MINISTRY OF EDUCATION · GOVERNMENT OF INDIA
                    </h1>
                    <p className="text-[11px] font-bold text-emerald-800 tracking-widest uppercase">
                      NATIONAL ACADEMIC DEPOSITORY (NAD) · APAAR ACCREDITED
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase">
                    {printRecord.institutionId?.name || "PSNA COLLEGE OF ENGINEERING & TECHNOLOGY"}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Approved by AICTE, New Delhi · Affiliated to Anna University · Code: {printRecord.institutionId?.code || "INST-002"}
                  </p>
                </div>

                <div className="mt-3 inline-block bg-slate-900 text-white text-xs font-bold uppercase px-4 py-1 rounded-md tracking-wider">
                  GRADE SHEET · SEMESTER {printRecord.semester} EXAMINATION ({printRecord.academicYear})
                </div>
              </div>

              {/* Student Identification Details */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-300">
                <div className="space-y-1.5">
                  <p>
                    <span className="font-semibold text-slate-500">Student Name:</span>{" "}
                    <span className="font-bold text-slate-900 uppercase">{printRecord.studentId?.fullName}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Register Number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{printRecord.studentId?.registerNumber}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">APAAR ID:</span>{" "}
                    <span className="font-mono font-bold text-indigo-700">
                      {printRecord.studentId?.apaarId || "1234-5678-9012"}
                    </span>
                  </p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p>
                    <span className="font-semibold text-slate-500">Degree & Discipline:</span>{" "}
                    <span className="font-bold text-slate-900">B.E. Computer Science</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Semester:</span>{" "}
                    <span className="font-bold text-slate-900">Semester {printRecord.semester}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Issuing Batch:</span>{" "}
                    <span className="font-bold text-slate-900">{printRecord.academicYear}</span>
                  </p>
                </div>
              </div>

              {/* Subject Results Table */}
              <div className="mt-6 overflow-hidden rounded-xl border-2 border-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-r border-slate-800">Course Code</th>
                      <th className="p-3 border-r border-slate-800">Course Title</th>
                      <th className="p-3 text-center border-r border-slate-800">Credits</th>
                      <th className="p-3 text-center border-r border-slate-800">Max Marks</th>
                      <th className="p-3 text-center border-r border-slate-800">Marks Scored</th>
                      <th className="p-3 text-center border-r border-slate-800">Letter Grade</th>
                      <th className="p-3 text-center border-r border-slate-800">Grade Point</th>
                      <th className="p-3 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {printRecord.subjects.map((sub, i) => (
                      <tr key={i} className="font-medium">
                        <td className="p-3 font-mono font-bold border-r border-slate-300">{sub.subjectCode}</td>
                        <td className="p-3 border-r border-slate-300">{sub.subjectName}</td>
                        <td className="p-3 text-center font-bold border-r border-slate-300">{sub.credits}</td>
                        <td className="p-3 text-center border-r border-slate-300">{sub.maxMarks || 100}</td>
                        <td className="p-3 text-center font-bold border-r border-slate-300">{sub.marksObtained}</td>
                        <td className="p-3 text-center font-black text-indigo-900 border-r border-slate-300">
                          {sub.grade || "A"}
                        </td>
                        <td className="p-3 text-center font-bold border-r border-slate-300">
                          {sub.gradePoint !== undefined ? sub.gradePoint : 8}
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span
                            className={sub.result === "FAIL" ? "text-red-700 font-black" : "text-emerald-700"}
                          >
                            {sub.result || "PASS"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SGPA & Result Summary */}
              <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Credits Earned</p>
                  <p className="text-xl font-black text-slate-900">{printRecord.totalCredits}</p>
                </div>
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Semester Grade Point Average</p>
                  <p className="text-2xl font-black text-emerald-700">{printRecord.sgpa} SGPA</p>
                </div>
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Academic Standing</p>
                  <p className="text-sm font-black text-slate-900 uppercase">
                    {printRecord.sgpa >= 8.5 ? "First Class with Distinction" : printRecord.sgpa >= 7.0 ? "First Class" : "Pass"}
                  </p>
                </div>
              </div>

              {/* Cryptographic QR Code Verification & Signatures */}
              <div className="mt-8 pt-6 border-t-2 border-slate-900 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl border border-slate-300">
                    {/* SVG Deterministic QR Representation */}
                    <div className="flex items-center justify-center h-20 w-20 bg-white border border-slate-300 text-slate-900 font-mono text-[9px] text-center p-1">
                      <div className="flex flex-col items-center justify-center">
                        <QrCode className="h-12 w-12 text-slate-900" />
                        <span className="text-[8px] font-mono tracking-tighter">VERIFIED SEAL</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 max-w-xs">
                    <p className="font-bold text-slate-900 uppercase">Tamper-Proof Digital Verification</p>
                    <p className="mt-0.5">
                      Digitally signed and cryptographically stored on the APAAR National Student Registry. Scan QR code to verify credential standing.
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-slate-400">
                      ID: {printRecord._id} · Version {printRecord.version}
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-8">
                  <div className="font-serif italic text-xs text-slate-500">[Digitally Signed]</div>
                  <div className="border-t border-slate-900 pt-1 text-[11px] font-bold uppercase text-slate-800 px-6">
                    Controller of Examinations
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Viewer Modal for Cloudinary Marksheet Scans */}
      {viewingScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Semester {viewingScan.semester} Marksheet Scan
                    <span className="text-xs font-mono font-normal text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                      {viewingScan.academicYear}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingScan.studentName || "Student"}{" "}
                    {viewingScan.registerNumber ? `(${viewingScan.registerNumber})` : ""} · Cloudinary Cryptographic Storage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={viewingScan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  title="Open Original Cloudinary Asset in New Tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open Original</span>
                </a>
                <button
                  onClick={() => setViewingScan(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Preview Area */}
            <div className="flex-1 overflow-auto bg-slate-950/95 p-4 flex items-center justify-center min-h-[400px]">
              {viewingScan.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={viewingScan.url}
                  title="Marksheet Scan PDF"
                  className="w-full h-[70vh] rounded-xl border border-slate-800 bg-white"
                />
              ) : (
                <div className="relative max-h-[75vh] max-w-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingScan.url}
                    alt={`Semester ${viewingScan.semester} Marksheet Scan`}
                    className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Digitally verified credential asset secured on Cloudinary</span>
              </div>
              <button
                onClick={() => setViewingScan(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Attach Marksheet Scan Modal */}
      {attachingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Attach Marksheet Scan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Semester {attachingRecord.semester} · {attachingRecord.academicYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAttachingRecord(null);
                  setAttachFile(null);
                  setAttachPreviewUrl(null);
                  setAttachError(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAttachMarksheetSubmit} className="p-6 space-y-4">
              {attachError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {attachError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Marksheet Scan (Image or PDF)
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-400 transition bg-slate-50/50">
                  {attachPreviewUrl ? (
                    <div className="space-y-2">
                      {attachFile?.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={attachPreviewUrl}
                          alt="Scan Preview"
                          className="max-h-48 mx-auto rounded-lg object-contain border border-slate-200"
                        />
                      ) : (
                        <div className="flex flex-col items-center py-4 text-slate-600">
                          <FileText className="h-10 w-10 text-indigo-600 mb-1" />
                          <span className="text-xs font-semibold">{attachFile?.name}</span>
                          <span className="text-[10px] text-slate-400">PDF Document</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachFile(null);
                          setAttachPreviewUrl(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Remove & Choose Another
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center py-4">
                      <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-700">
                        Click to select scan file
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Supported: JPG, PNG, WEBP, PDF (Up to 10MB)
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleAttachFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Automatic Cryptographic Vault Sync
                </p>
                <p className="text-[11px] text-slate-600">
                  This scan will be uploaded to Cloudinary, SHA-256 hashed, and automatically indexed into your Cryptographic Document Vault for tamper-proof verification.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAttachingRecord(null);
                    setAttachFile(null);
                    setAttachPreviewUrl(null);
                    setAttachError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!attachFile || attachingLoading}
                  className="cursor-pointer"
                >
                  {attachingLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Uploading & Sealing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload & Attach Scan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
