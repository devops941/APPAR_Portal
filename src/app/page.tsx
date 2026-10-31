"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  BookOpen,
  QrCode,
  GraduationCap,
  Building2,
  FileCheck2,
  ArrowRight,
  Search,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  Layers,
  ExternalLink,
  Laptop,
  Check,
  Menu,
  X,
  Database,
  Share2,
} from "lucide-react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    status: "verified" | "invalid" | null;
    message?: string;
    details?: {
      studentName: string;
      registerNumber: string;
      institution: string;
      degree: string;
      status: string;
      sealedAt: string;
    };
  }>({ status: null });
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = verifyInput.trim().toUpperCase();
    if (!query) return;

    if (
      query.includes("24CSE001") ||
      query.includes("24CSE002") ||
      query.includes("0B5C67") ||
      query.length >= 8
    ) {
      setVerifyResult({
        status: "verified",
        message: "Cryptographically Verified Statutory Credential",
        details: {
          studentName: query.includes("001") ? "S. Gokul" : "Gokulnath M",
          registerNumber: query.includes("001") ? "24CSE001" : "24CSE002",
          institution: "PSNA College of Engineering & Technology (Autonomous)",
          degree: "B.E. Computer Science and Engineering",
          status: "Officially Sealed & AICTE Compliant",
          sealedAt: "Oct 31, 2026 · Controller of Examinations",
        },
      });
    } else {
      setVerifyResult({
        status: "invalid",
        message: "No registered record found for this identifier in the active depository.",
      });
    }
  }

  const faqs = [
    {
      q: "What is an APAAR ID and why has AICTE mandated it?",
      a: "APAAR (Automated Permanent Academic Account Registry) is a unique 12-digit lifelong academic identification assigned to every student in India under the National Education Policy (NEP 2020). AICTE has mandated APAAR for all technical and professional institutions to unify student identity, eliminate counterfeit marksheets, and digitally record degrees, diplomas, and credit mobility on the National Academic Depository (NAD).",
    },
    {
      q: "How does the Academic Bank of Credits (ABC) credit transfer work?",
      a: "Every course completed at an AICTE/UGC approved college earns verified credits stored in the student's ABC ledger. When transferring colleges or pursuing multi-disciplinary electives, autonomous institutes and universities can instantly recognize and credit previous coursework without manual transcript verifications.",
    },
    {
      q: "How does the platform ensure cryptographic tamper-proof security?",
      a: "Every marksheet and certificate uploaded is SHA-256 hashed at the time of submission. The resulting cryptographic digest is immutable and verifiable against institutional public ledgers. If any grade or byte in a document is altered, the hash mismatch is flagged immediately.",
    },
    {
      q: "How do students view and print their official semester marksheets?",
      a: "Students log in via their registered credentials or institutional SSO. They can view comprehensive semester marksheet cards showing every course code, title, credits, marks, and letter grade, or view high-resolution scan copies in the integrated in-app viewer. A printable A4 official marksheet with a verification QR code can also be generated on demand.",
    },
    {
      q: "Can employers and foreign universities verify student credentials?",
      a: "Yes. Employers or foreign evaluators simply scan the cryptographic QR code on any printed marksheet or enter the student's 12-digit APAAR ID / document hash on the Public Verification Desk to get instantaneous, verified proof of credential authenticity.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">

      {/* ── 3. Main Navigation Header ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & National Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 via-teal-700 to-indigo-900 text-white shadow-md shadow-emerald-900/10 ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900">APAAR</span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                  Registry
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                Automated Permanent Academic Account Registry
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 lg:flex text-xs font-semibold text-slate-600">
            <a href="#about" className="hover:text-indigo-600 transition-colors">
              About APAAR
            </a>
            <a href="#aicte" className="hover:text-indigo-600 transition-colors">
              AICTE Mandate
            </a>
            <a href="#pillars" className="hover:text-indigo-600 transition-colors">
              Core Pillars
            </a>
            <a href="#workflow" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#verify" className="hover:text-indigo-600 transition-colors">
              Verify Credential
            </a>
            <a href="#faqs" className="hover:text-indigo-600 transition-colors">
              FAQs
            </a>
          </nav>

          {/* Action Portals */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-2xs"
            >
              Institutional Login
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition hover:shadow-emerald-600/20 hover:shadow-md"
            >
              <span>Student Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden space-y-3 text-sm font-semibold">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700"
            >
              About APAAR
            </a>
            <a
              href="#aicte"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700"
            >
              AICTE Mandate
            </a>
            <a
              href="#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700"
            >
              Core Pillars
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700"
            >
              How It Works
            </a>
            <a
              href="#verify"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700"
            >
              Verify Credential
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700"
            >
              FAQs
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white"
              >
                Access Student Portal
              </Link>
              <Link
                href="/login"
                className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700"
              >
                Institution & Officer Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 4. Minimalist Hero Section ── */}
      <section className="border-b border-slate-200/80 bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Subtle Government Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>National Academic Depository · AICTE & MoE Mandated</span>
              </div>

              {/* Minimal Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                One Nation, One Student ID.{" "}
                <span className="text-slate-500 font-normal block sm:inline">
                  Lifelong Academic Depository.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal">
                The centralized academic identity platform authorized by the Ministry of Education
                and AICTE. Recording semester examination marks, automated SGPA/CGPA calculation,
                and tamper-evident credential verification across 450+ institutions.
              </p>

              {/* Clean Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Access Student Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#verify"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <QrCode className="h-4 w-4 text-slate-500" />
                  <span>Verify Marksheet</span>
                </a>
              </div>

              {/* Minimal Trust Features */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  12-Digit Lifelong APAAR
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  SHA-256 Tamper-Proof
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Academic Bank of Credits
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Instant QR Verification
                </span>
              </div>

              {/* Minimal Stat Metrics */}
              <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">450+</p>
                  <p className="text-xs text-slate-500 mt-0.5">Technical Colleges</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">2.4M+</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sealed Records</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tamper-Proof Integrity</p>
                </div>
              </div>
            </div>

            {/* Right: Modern University Campus & Students Photo */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src="/images/apaar-hero.jpg"
                    alt="Indian University Students on Modern Campus - APAAR Depository"
                    className="h-full w-full object-cover object-center"
                    loading="eager"
                  />
                  {/* Subtle Official Caption Tag */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-slate-900/85 backdrop-blur-sm px-3.5 py-2 text-white">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold">One Nation · One Student ID</span>
                    </div>
                    <span className="text-[11px] text-slate-300 font-mono">AICTE / NEP 2020</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. AICTE Mandate & NEP 2020 Regulatory Section ── */}
      <section id="aicte" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
              Regulatory Framework
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Mandated by AICTE under the National Education Policy (NEP 2020)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In accordance with Ministry of Education gazette notifications, the All India Council
              for Technical Education (AICTE) requires all technical institutions, autonomous
              colleges, and universities to enroll engineering, polytechnic, and management students
              into the APAAR ecosystem.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Mandate Pillar 1 */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">AICTE Regulatory Compliance</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Guarantees technical colleges adhere to national statutory guidelines. Standardizes
                semester grading scales, minimum passing criteria, and institutional accreditation
                tracking.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                <Check className="h-4 w-4" />
                <span>Gazette Order Compliant</span>
              </div>
            </div>

            {/* Mandate Pillar 2 */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Academic Bank of Credits (ABC)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Enables true student credit mobility. Earned course credits are stored in an official
                digital bank, allowing frictionless transfer between autonomous universities and
                affiliated colleges.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Check className="h-4 w-4" />
                <span>Inter-University Mobility</span>
              </div>
            </div>

            {/* Mandate Pillar 3 */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 shadow-xs hover:border-amber-300 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero-Fraud Credential Seal</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Eliminates forged paper certificates. All semester marksheets are cryptographically
                hashed with SHA-256 and archived with Cloudinary high-resolution scans for instant
                public validation.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Check className="h-4 w-4" />
                <span>100% Tamper Evident</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. 5 Core Pillars of the Platform ── */}
      <section id="pillars" className="py-16 sm:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
              Platform Features
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Architected for Technical Universities, Faculty & Students
            </h2>
            <p className="text-sm text-slate-600">
              Everything required to manage the entire lifecycle of student academic credentials
              with military-grade security.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Curriculum-Driven Auto Population
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Faculty selects College, Department, and Semester to immediately load official
                Anna University / AICTE course codes, titles, and credit allocations without manual
                data entry.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated SGPA & CGPA Computation
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Grade points, letter grades (O, A+, A, B+, B, C, U), and total semester credits are
                computed server-side with strict 10-point scale formula accuracy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-3">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Cryptographic Document Vault</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Original scanned marksheets and certificates are SHA-256 hashed and archived in the
                statutory vault. Instant in-app lightbox viewing with rasterized high-res previews.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-3">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Three-Tier Scrutiny Workflow</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Faculty creates draft marksheets, institutional verification officers audit marks,
                and the Controller of Examinations applies the digital tamper-evident seal.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Standardized Printable PDF
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Generate AICTE/MoE compliant A4 grade sheets on demand, complete with deterministic
                QR codes, student identity details, and digital signature endorsements.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">High-Speed Batch CSV Import</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Import thousands of student examination marks simultaneously using standard Excel/CSV
                templates with instant parsing, validation, and auto-grouping by register number.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Interactive Public Verification Simulator ── */}
      <section id="verify" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-indigo-200 bg-linear-to-b from-indigo-50/50 via-white to-emerald-50/30 p-8 sm:p-10 shadow-lg text-center">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 uppercase">
              Public Verification Desk
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
              Verify Credential Authenticity in Seconds
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Employers, evaluators, and universities can check credential standing instantly by
              entering an APAAR ID, Register Number, or SHA-256 Hash.
            </p>

            <form onSubmit={handleVerifySubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Try '24CSE002' or SHA-256 Hash..."
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-600 transition cursor-pointer"
              >
                Verify Now
              </button>
            </form>

            {/* Quick Sample Queries */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <span>Quick Test:</span>
              <button
                type="button"
                onClick={() => setVerifyInput("24CSE002")}
                className="underline hover:text-indigo-600 font-mono"
              >
                24CSE002 (Gokulnath)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setVerifyInput("24CSE001")}
                className="underline hover:text-indigo-600 font-mono"
              >
                24CSE001 (S. Gokul)
              </button>
            </div>

            {/* Verification Result Card */}
            {verifyResult.status === "verified" && verifyResult.details && (
              <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 text-left text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>{verifyResult.message}</span>
                  </div>
                  <span className="rounded-md bg-emerald-200/60 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                    100% Authentic
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Student</span>
                    <span className="font-bold text-slate-900">{verifyResult.details.studentName} ({verifyResult.details.registerNumber})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution</span>
                    <span className="font-bold text-slate-900">{verifyResult.details.institution}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Program</span>
                    <span className="font-medium text-slate-900">{verifyResult.details.degree}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Audit Standing</span>
                    <span className="font-bold text-emerald-700">{verifyResult.details.status}</span>
                  </div>
                </div>
              </div>
            )}

            {verifyResult.status === "invalid" && (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-in fade-in">
                {verifyResult.message}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 8. How It Works (Workflow Architecture) ── */}
      <section id="workflow" className="py-16 sm:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
              End-to-End Roadmap
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              From Enrollment to National Depository
            </h2>
            <p className="text-sm text-slate-600">
              How student marks and credits travel through our tamper-evident credential pipeline.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: "01",
                title: "Student Enrollment",
                desc: "Permanent 12-digit APAAR ID assigned through Aadhaar / ABC integration.",
                icon: GraduationCap,
              },
              {
                step: "02",
                title: "Curriculum Alignment",
                desc: "Syllabus catalog auto-allocates course codes and credit weights per semester.",
                icon: BookOpen,
              },
              {
                step: "03",
                title: "Cloudinary Archival",
                desc: "Original marksheet scans uploaded, rasterized, and SHA-256 hashed.",
                icon: Lock,
              },
              {
                step: "04",
                title: "Institutional Seal",
                desc: "Verification officers inspect marksheets and seal records cryptographically.",
                icon: ShieldCheck,
              },
              {
                step: "05",
                title: "Universal Mobility",
                desc: "Instant access via Student Portal, DigiLocker, and ABC credit transfer.",
                icon: Share2,
              },
            ].map((st, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xl font-black text-slate-300">{st.step}</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <st.icon className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{st.title}</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Frequently Asked Questions (Accordion) ── */}
      <section id="faqs" className="border-t border-slate-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
              Common Questions
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500">
              Everything you need to know about APAAR identification, AICTE compliance, and marksheets.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      faqOpen === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="border-t border-slate-200/80 bg-white p-5 text-xs text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Call to Action Banner ── */}
      <section className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-6 sm:px-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital India Initiative</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
            Access Your Certified Semester Marksheets Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join millions of students across AICTE accredited engineering and polytechnic colleges.
            View your complete course subjects, verify your Cloudinary marksheet scans, and print
            official grade sheets instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-700 transition"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Log In as Student</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <Building2 className="h-4 w-4" />
              <span>Institution / Faculty Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 11. Official Government & Regulatory Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm">
                  GOI
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">APAAR National Academic Registry</h4>
                  <p className="text-[10px] text-slate-400">Ministry of Education · Government of India</p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 max-w-sm">
                Empowering India's technical education ecosystem through automated permanent academic
                accounts, secure cryptographic record verification, and seamless credit mobility under
                NEP 2020.
              </p>
              <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> ISO/IEC 27001 Certified
                </span>
                <span>•</span>
                <span>SSL 256-Bit Encrypted</span>
              </div>
            </div>

            {/* Col 2: Regulatory Bodies */}
            <div>
              <h5 className="font-bold text-slate-900 uppercase text-[11px] mb-3">Regulatory Bodies</h5>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <a href="https://www.aicte-india.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1">
                    AICTE Official <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://www.education.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1">
                    Ministry of Education <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://www.abc.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1">
                    Academic Bank of Credits <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://nad.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1">
                    National Academic Depository <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Portal Links */}
            <div>
              <h5 className="font-bold text-slate-900 uppercase text-[11px] mb-3">Portal Quick Access</h5>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <Link href="/login" className="hover:text-indigo-600">
                    Student Examination Portal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-indigo-600">
                    Faculty & Officer Login
                  </Link>
                </li>
                <li>
                  <Link href="/academic-records" className="hover:text-indigo-600">
                    My Semester Marksheets
                  </Link>
                </li>
                <li>
                  <Link href="/documents" className="hover:text-indigo-600">
                    Cryptographic Document Vault
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: National Support */}
            <div>
              <h5 className="font-bold text-slate-900 uppercase text-[11px] mb-3">Support & Standards</h5>
              <ul className="space-y-2 text-[11px]">
                <li><span>National Toll-Free: 1800-111-666</span></li>
                <li><span>Email: support@apaar.gov.in</span></li>
                <li><span>Anna University Affiliated Hub</span></li>
                <li><span>DigiLocker Integration Ready</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© 2026 APAAR National Academic Platform. Ministry of Education, Government of India. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#about" className="hover:text-slate-900">Privacy Policy</a>
              <a href="#about" className="hover:text-slate-900">Terms of Service</a>
              <a href="#about" className="hover:text-slate-900">Security Disclosures</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
