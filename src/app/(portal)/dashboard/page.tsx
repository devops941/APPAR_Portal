"use client";

import { useEffect, useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import {
  GraduationCap, ShieldCheck, CheckCircle2,
  TrendingUp, RefreshCw, FileText, ArrowUpRight, Search,
  Award, ShieldAlert, Sparkles, Filter, Building2
} from "lucide-react";
import { KpiStatCard } from "@/components/ui/KpiStatCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface DashboardData {
  kpis: {
    totalStudents: number;
    apaarRecorded: number;
    apaarCoveragePct: number;
    pendingReviews: number;
    verifiedRecords: number;
    totalInstitutions: number;
    rejectedRecords: number;
  };
  charts: {
    verificationBreakdown: { name: string; value: number; color: string }[];
    departmentStats: { name: string; total: number; withApaar: number }[];
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; role: string; institutionName?: string } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("all");
  const [deptFilter, setDeptFilter] = useState("ALL");

  async function loadData() {
    try {
      const r = await fetch("/api/reports/dashboard");
      const d = await r.json();
      if (d.success) setData(d.data);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && res.data) setUser(res.data);
      })
      .catch(() => {});
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredDeptStats = useMemo(() => {
    if (!data?.charts?.departmentStats) return [];
    if (deptFilter === "ALL") return data.charts.departmentStats;
    return data.charts.departmentStats.filter(
      (d) => d.name.toLowerCase().includes(deptFilter.toLowerCase())
    );
  }, [data, deptFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading statutory platform intelligence...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Statutory Dashboard</h1>
          <p className="text-sm text-slate-500">Academic bank of credits & student verification analytics</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">Connect to MongoDB to load live institutional metrics.</p>
          <Button onClick={handleRefresh} className="mt-4" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  const kpis = data.kpis;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {user?.role === "INSTITUTION_ADMIN"
                ? `${user.institutionName || "College"} Dashboard`
                : "National APAAR Dashboard"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
              {user?.role === "INSTITUTION_ADMIN" ? "Live Campus Telemetry" : "Live Telemetry"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {user?.role === "INSTITUTION_ADMIN"
              ? `Real-time student enrollment, departmental credit tallies, and marksheet audit status for ${user.institutionName || "your institution"}`
              : "Real-time enrollment, automated credit tally, and statutory verification overview"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Period Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: "all", label: "All Time" },
              { id: "ay2025", label: "AY 2024-25" },
              { id: "term1", label: "Odd Term" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  timeRange === t.id
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold shadow-sm"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {user?.role === "SUPER_ADMIN" ? (
            <Link href="/audit-logs">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold cursor-pointer">
                <FileText className="mr-2 h-3.5 w-3.5" /> Compliance Audit
              </Button>
            </Link>
          ) : (
            <Link href="/documents">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold cursor-pointer">
                <FileText className="mr-2 h-3.5 w-3.5" /> Document Vault
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Primary Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="Total Registered Students"
          value={kpis.totalStudents.toLocaleString()}
          change="+14.2% YoY"
          trend="up"
          theme="indigo"
          icon={GraduationCap}
        />
        <KpiStatCard
          label="APAAR Coverage Rate"
          value={`${kpis.apaarCoveragePct}%`}
          change={`${kpis.apaarRecorded} Recorded IDs`}
          trend="up"
          theme="emerald"
          icon={TrendingUp}
        />
        <KpiStatCard
          label="Pending Verifications"
          value={kpis.pendingReviews.toLocaleString()}
          change="Requires Attention"
          trend="down"
          theme="amber"
          icon={ShieldCheck}
        />
        <KpiStatCard
          label="Verified Credentials"
          value={kpis.verifiedRecords.toLocaleString()}
          change="Integrity Validated"
          trend="up"
          theme="default"
          icon={CheckCircle2}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Verification Status Donut */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Verification Status Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution of marksheet audit decisions</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {data.charts.verificationBreakdown.reduce((sum, item) => sum + item.value, 0)} Records
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.verificationBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={55}
                    paddingAngle={4}
                  >
                    {data.charts.verificationBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B132B",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {kpis.apaarCoveragePct}%
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Adoption
                </span>
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="mt-2 grid w-full grid-cols-2 gap-2">
              {data.charts.verificationBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 px-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department-wise APAAR Adoption */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Departmental APAAR Penetration</h3>
              <p className="text-xs text-slate-500">Comparison of total enrollment vs registered APAAR IDs</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Departments</option>
                {data.charts.departmentStats.map((d, i) => (
                  <option key={i} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDeptStats} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    backgroundColor: "#061C18",
                    borderRadius: "12px",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="total"
                  name="Enrolled Students"
                  fill="#94a3b8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="withApaar"
                  name="APAAR Recorded"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* APAAR Coverage Progress & Compliance Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                {user?.role === "INSTITUTION_ADMIN"
                  ? `${user.institutionName || "Campus"} APAAR Onboarding Funnel`
                  : "National APAAR Onboarding Funnel"}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Statutory mandate compliance under National Education Policy (NEP 2020) and ABC framework
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {kpis.apaarRecorded} of {kpis.totalStudents} Students Onboarded
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Overall Statutory Coverage</span>
            <span className="text-emerald-600 font-extrabold">{kpis.apaarCoveragePct}%</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-500 transition-all duration-700 ease-out"
              style={{ width: `${kpis.apaarCoveragePct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Strict privacy adherence: Masked 12-digit format utilized across all scrutiny views</span>
          </div>
          <span className="text-[11px] text-slate-400">Ref: NEP-ABC-REG-2024/09</span>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/students" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <GraduationCap className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">Student Directory</h4>
          <p className="mt-0.5 text-xs text-slate-500">Manage student records & batch CSV imports</p>
        </Link>

        <Link href="/academic-records" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
              <Award className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">Academic Marksheets</h4>
          <p className="mt-0.5 text-xs text-slate-500">Issue semester marks & calculate credits</p>
        </Link>

        {user?.role === "SUPER_ADMIN" ? (
          <Link href="/verifications" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900">Scrutiny Queue</h4>
            <p className="mt-0.5 text-xs text-slate-500">Officer verification & record attestation</p>
          </Link>
        ) : (
          <Link href="/institutions" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Building2 className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900">Institution Profile</h4>
            <p className="mt-0.5 text-xs text-slate-500">Manage college accreditation & departments</p>
          </Link>
        )}

        <Link href="/documents" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-[#061C18] group-hover:text-white transition">
              <FileText className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">Document Vault</h4>
          <p className="mt-0.5 text-xs text-slate-500">Cryptographic SHA-256 integrity storage</p>
        </Link>
      </div>
    </div>
  );
}
