"use client";

import { useEffect, useState } from "react";
import {
  Lock, Eye, EyeOff, FileText, Shield, Clock, Award,
  GraduationCap, QrCode, CheckCircle2, ChevronRight,
  ExternalLink, Building2, BookOpen, Sparkles
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import { maskApaarId, formatApaarId } from "@/lib/utils/apaar";
import Link from "next/link";

interface StudentProfile {
  fullName: string;
  registerNumber: string;
  apaarId?: string;
  admissionYear: number;
  currentSemester: number;
  gender: string;
  institutionId?: { name: string; code: string };
  departmentId?: { name: string; code: string };
}

interface AcademicRecord {
  _id: string;
  semester: number;
  academicYear: string;
  sgpa: number;
  totalCredits: number;
  status: string;
  subjects: { subjectCode: string; subjectName: string; credits: number; grade: string; result: string }[];
}

interface Consent {
  _id: string;
  requesterName: string;
  purpose: string;
  requestedFields: string[];
  state: string;
  expiresAt: string;
  createdAt: string;
}

export default function StudentPortalPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [revealedApaar, setRevealedApaar] = useState<string | null>(null);
  const [revealCountdown, setRevealCountdown] = useState(0);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const [profRes, recsRes, consRes] = await Promise.all([
          fetch("/api/student/profile").then((r) => r.json()),
          fetch("/api/student/academic-records").then((r) => r.json()),
          fetch("/api/student/consents").then((r) => r.json()),
        ]);
        if (profRes.success) setProfile(profRes.data);
        if (recsRes.success) setRecords(recsRes.data.records || []);
        if (consRes.success) setConsents(consRes.data.consents || []);
      } catch (err) {
        console.error("Error loading student portal data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, []);

  async function handleReveal() {
    if (revealed) {
      setRevealed(false);
      setRevealedApaar(null);
      setRevealCountdown(0);
      return;
    }
    try {
      const res = await fetch("/api/student/reveal-apaar", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRevealed(true);
        setRevealedApaar(data.data.apaarId);
        setRevealCountdown(10);
      }
    } catch (err) {
      console.error("Reveal error:", err);
    }
  }

  // Countdown timer for auto-mask
  useEffect(() => {
    if (revealCountdown > 0) {
      const timer = setTimeout(() => setRevealCountdown(revealCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (revealed && revealCountdown === 0) {
      setRevealed(false);
      setRevealedApaar(null);
    }
  }, [revealCountdown, revealed]);

  const totalCredits = records.reduce((sum, r) => sum + (r.totalCredits || 0), 0);
  const totalWeightedSgpa = records.reduce((sum, r) => sum + r.sgpa * r.totalCredits, 0);
  const cgpa = totalCredits > 0 ? (totalWeightedSgpa / totalCredits).toFixed(2) : "0.00";
  const verifiedRecordsCount = records.filter((r) => r.status === "VERIFIED").length;

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading student identity records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Identity & Academic Vault</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Enrolled & Active
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            One Nation, One Student ID — Statutory APAAR Credentials and Academic Bank of Credits (ABC)
          </p>
        </div>

        <Link href="/documents">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Upload Marksheet / Proof
          </Button>
        </Link>
      </div>

      {/* Modern Digital APAAR ID Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-[#061C18] p-6 sm:p-8 text-white shadow-xl ring-1 ring-emerald-500/20">
        {/* Subtle Decorative Background Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-emerald-200 ring-1 ring-white/20">
                GOVERNMENT OF INDIA · ABC SYSTEM
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                <Shield className="h-3 w-3" /> Digitally Attested
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {profile?.fullName || "Student Name"}
              </h2>
              <p className="mt-1 font-mono text-sm font-semibold text-emerald-200">
                REG NO: {profile?.registerNumber}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>{profile?.institutionId?.name || "Affiliated Institution"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                <span>{profile?.departmentId?.name || "Department of Engineering"}</span>
              </div>
              <div>
                <span className="text-slate-400">Batch: </span>
                <span className="font-semibold text-white">{profile?.admissionYear}</span>
              </div>
            </div>
          </div>

          {/* QR Code & Digital Seal Graphic */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-inner">
              <QrCode className="h-full w-full text-slate-900" />
            </div>
            <p className="text-[11px] font-mono text-slate-400 text-right">
              SCAN TO VERIFY<br />DIGILOCKER / ABC
            </p>
          </div>
        </div>

        {/* 12-Digit Masked APAAR ID Box */}
        <div className="relative z-10 mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                Automated Permanent Academic Account Registry (APAAR ID)
              </p>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-white">
                  {revealed && revealedApaar
                    ? formatApaarId(revealedApaar)
                    : maskApaarId(profile?.apaarId || "000000000000")}
                </span>
                {revealed && (
                  <span className="animate-pulse rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReveal}
                className="flex items-center gap-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95"
              >
                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {revealed ? "Hide Number" : "Reveal (10s)"}
              </button>

              {revealCountdown > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>Auto-mask in {revealCountdown}s</span>
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-300">
            Confidentiality Note: Your APAAR ID is cryptographically hashed and masked by default in compliance with national privacy guidelines. All manual reveals are logged in the statutory audit log.
          </p>
        </div>
      </div>

      {/* 4 Academic KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="Cumulative Grade Point Average"
          value={cgpa}
          change="Scale of 10.0"
          trend="up"
          theme="indigo"
          icon={Award}
        />
        <KpiStatCard
          label="Current Semester"
          value={`Semester ${profile?.currentSemester || 1}`}
          change="Academic Standing"
          trend="neutral"
          theme="default"
          icon={GraduationCap}
        />
        <KpiStatCard
          label="Total Earned Credits"
          value={totalCredits}
          change="ABC Credited"
          trend="up"
          theme="emerald"
          icon={CheckCircle2}
        />
        <KpiStatCard
          label="Verified Marksheets"
          value={`${verifiedRecordsCount} / ${records.length}`}
          change="Scrutiny Attested"
          trend="up"
          theme="amber"
          icon={Shield}
        />
      </div>

      {/* Semester Academic Progression */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Academic Progression & Semester Marksheets</h3>
            <p className="text-xs text-slate-500">Official course credits, letter grades, and statutory verification status</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {records.length} Semesters Recorded
          </span>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-xs font-medium text-slate-500">No semester academic records published yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {records.map((rec) => (
              <div
                key={rec._id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-sm">
                      S{rec.semester}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Semester {rec.semester} Marksheet
                      </h4>
                      <p className="text-xs text-slate-500">Academic Year: {rec.academicYear}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold">Semester GPA</p>
                      <p className="text-base font-extrabold text-indigo-600">{rec.sgpa.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold">Credits</p>
                      <p className="text-base font-extrabold text-slate-800">{rec.totalCredits}</p>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                </div>

                {/* Subject Grade Pills */}
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Course Breakdown & Letter Grades
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {rec.subjects.map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-2.5 px-3 shadow-xs"
                      >
                        <div className="truncate mr-2">
                          <p className="font-mono text-xs font-bold text-slate-800">{sub.subjectCode}</p>
                          <p className="truncate text-[10px] text-slate-500">{sub.subjectName}</p>
                        </div>
                        <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700">
                          {sub.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Third-Party Consent History */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Third-Party Consent History</h3>
              <p className="text-xs text-slate-500">
                Explicit consent grants for employer verification, scholarship scrutiny, and credit transfer
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {consents.length} Grants
          </span>
        </div>

        {consents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active or historical third-party consent requests found.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Authorized Requester</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Requested Fields</th>
                  <th className="px-4 py-3">Date Granted</th>
                  <th className="px-4 py-3 text-right">Consent State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {consents.map((c) => (
                  <tr key={c._id} className="transition hover:bg-indigo-50/30">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{c.requesterName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{c.purpose}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {c.requestedFields.map((f, i) => (
                          <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <StatusBadge status={c.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
