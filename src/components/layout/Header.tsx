"use client";

import { useEffect, useState } from "react";
import { Search, Bell, LogOut, User, Calendar } from "lucide-react";
import Link from "next/link";

interface MeResponse {
  success: boolean;
  data?: {
    name: string;
    email: string;
    role: string;
    institutionName?: string;
  };
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeResponse) => {
        if (data?.success && data.data) setUser(data.data);
      })
      .catch(() => {});

    // Live formatted date
    const d = new Date();
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    setCurrentDate(formatted);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SS";

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Search Input matching reference UI */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, APAAR IDs, records, institutions..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-xs text-ink placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Right Action Icons & User Chip */}
      <div className="flex items-center gap-4">
        {/* Date Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{currentDate || "Thu, 29 Oct 2026"}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white animate-pulse" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Pill matching screenshot */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1 hover:bg-slate-100 transition group text-left"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 text-xs font-bold text-white shadow-xs">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>

            <div className="hidden md:block">
              <p className="text-xs font-semibold text-ink leading-tight">
                {user?.name || "System Super Administrator"}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {user?.role ? user.role.replace(/_/g, " ").toLowerCase() : "System Administrator"}
              </p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-ink">{user?.name || "Super Administrator"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || "admin@aicte.gov.in"}</p>
                <span className="mt-1 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  {user?.role || "SUPER_ADMIN"}
                </span>
              </div>

              <div className="pt-1">
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
