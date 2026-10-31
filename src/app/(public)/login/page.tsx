"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Persona {
  role: string;
  email: string;
  pass: string;
  sub: string;
}

const DEMO_PERSONAS: Persona[] = [
  {
    role: "Super Admin",
    email: "admin@aicte.gov.in",
    pass: "Admin@123",
    sub: "AICTE Regulatory Overview",
  },
  {
    role: "College Admin",
    email: "admin.chennai@edu.in",
    pass: "Demo@12345",
    sub: "CIT Institutional Management",
  },
  {
    role: "Faculty",
    email: "faculty.cse@chennai.edu.in",
    pass: "Demo@12345",
    sub: "CSE Academic & Marks",
  },
  {
    role: "Verification Officer",
    email: "officer1@aicte.gov.in",
    pass: "Demo@12345",
    sub: "Credential Attestation Desk",
  },
  {
    role: "Student",
    email: "arun.kumar@chennai.edu.in",
    pass: "Demo@12345",
    sub: "Self-Service APAAR Portal",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@aicte.gov.in");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>("Super Admin");

  function selectPersona(p: Persona) {
    setEmail(p.email);
    setPassword(p.pass);
    setSelectedPersona(p.role);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Invalid credentials. Please verify your email and password.");
        return;
      }

      // Check role redirection
      const role = data?.data?.role;
      if (role === "STUDENT") {
        router.push("/student");
      } else if (role === "VERIFICATION_OFFICER") {
        router.push("/verifications");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/80 p-4 sm:p-6 lg:p-10 select-none">
      {/* Centered Floating Modern Card */}
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side — Form Area (7 Cols) */}
        <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Brand Logo & Pill */}
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-900">AICTE Portal</span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                APAAR Student
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Central statutory academic identity & verification workspace.
            </p>

            {/* Quick Demo Credentials Autofill Switcher */}
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-950">
                <span className="flex items-center gap-1 font-bold">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  DEMO CREDENTIALS
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Click to autofill</span>
              </div>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEMO_PERSONAS.map((p) => {
                  const isSelected = selectedPersona === p.role;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => selectPersona(p)}
                      className={`text-left rounded-xl p-2 transition border ${
                        isSelected
                          ? "bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30"
                          : "bg-white/70 border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">
                        {p.role} {isSelected && "✓"}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">{p.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@aicte.gov.in"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Remember me</span>
                </label>

                <a href="#" className="font-semibold text-emerald-700 hover:underline">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/30 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[10px] text-slate-400">
            © 2026 AICTE APAAR Platform · Statutory Academic Record Verification
          </p>
        </div>

        {/* Right Side — Vibrant Emerald & Teal Banner (5 Cols) */}
        <div className="relative hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-800 via-teal-900 to-[#061C18] p-8 text-white flex-col justify-between overflow-hidden">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />

          {/* Top Badges */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold backdrop-blur-xs border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span>SSL 256-bit Encrypted</span>
            </span>

            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium backdrop-blur-xs text-emerald-200">
              AICTE Central
            </span>
          </div>

          {/* Center Graphic / APAAR Identity Emblem */}
          <div className="relative z-10 my-auto py-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 shadow-xl shadow-emerald-950/40">
              <Fingerprint className="h-10 w-10 text-white" />
            </div>

            <h3 className="mt-5 text-xl font-bold tracking-tight text-white">
              One Nation, One Student ID
            </h3>
            <p className="mt-2 text-xs text-emerald-100/90 max-w-xs mx-auto leading-relaxed">
              Automated Permanent Academic Account Registry for lifelong student credential management.
            </p>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 border-t border-white/15 pt-4 text-center">
            <p className="text-[11px] font-semibold text-white/90">
              Statutory Student Data & Marksheet Scrutiny
            </p>
            <p className="text-[10px] text-emerald-200/80">
              Ministry of Education & AICTE Statutory Compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
