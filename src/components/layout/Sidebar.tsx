"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  ClipboardList,
  FileText,
  ShieldCheck,
  ScrollText,
  LogOut,
  X,
  Sparkles,
  UserCheck,
  Layers,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  institutionName?: string;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && res.data) setUser(res.data);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  // Filter navigation groups dynamically based on the authenticated user's role
  const navGroups: NavGroup[] = useMemo(() => {
    const role = user?.role;

    if (role === "STUDENT") {
      return [
        {
          title: "SOVEREIGN CREDENTIALS",
          items: [
            { label: "My APAAR Card", href: "/student", icon: UserCheck },
            { label: "My Marksheets", href: "/academic-records", icon: ClipboardList },
            { label: "My Document Vault", href: "/documents", icon: FileText },
          ],
        },
      ];
    }

    if (role === "FACULTY") {
      return [
        {
          title: "DEPARTMENT EVALUATION",
          items: [
            { label: "Curriculum Subjects", href: "/subjects", icon: BookOpen },
            { label: "Academic Records", href: "/academic-records", icon: ClipboardList },
            { label: "Students Directory", href: "/students", icon: GraduationCap },
            { label: "Document Vault", href: "/documents", icon: FileText },
          ],
        },
      ];
    }

    if (role === "VERIFICATION_OFFICER") {
      return [
        {
          title: "REGULATORY SCRUTINY",
          items: [
            { label: "Verification Desk", href: "/verifications", icon: ShieldCheck },
          ],
        },
      ];
    }

    if (role === "INSTITUTION_ADMIN") {
      return [
        {
          title: "COLLEGE ADMINISTRATION",
          items: [
            { label: "College Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Institution Profile", href: "/institutions", icon: Building2 },
            { label: "Departments", href: "/departments", icon: Layers },
          ],
        },
        {
          title: "STUDENT IDENTITY & APAAR",
          items: [
            { label: "Students Directory", href: "/students", icon: GraduationCap },
          ],
        },
        {
          title: "ACADEMICS & CREDENTIALS",
          items: [
            { label: "Curriculum Subjects", href: "/subjects", icon: BookOpen },
            { label: "Academic Records", href: "/academic-records", icon: ClipboardList },
            { label: "Document Vault", href: "/documents", icon: FileText },
          ],
        },
      ];
    }

    // Default / SUPER_ADMIN: Full Access to all administrative and regulatory modules
    return [
      {
        title: "CORE & INSTITUTIONS",
        items: [
          { label: "National Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Institutions Registry", href: "/institutions", icon: Building2 },
          { label: "Departments Directory", href: "/departments", icon: Layers },
        ],
      },
      {
        title: "STUDENT IDENTITY & APAAR",
        items: [
          { label: "Students Directory", href: "/students", icon: GraduationCap },
        ],
      },
      {
        title: "ACADEMICS & CREDENTIALS",
        items: [
          { label: "Curriculum Subjects", href: "/subjects", icon: BookOpen },
          { label: "Academic Records", href: "/academic-records", icon: ClipboardList },
          { label: "Document Vault", href: "/documents", icon: FileText },
        ],
      },
      {
        title: "SCRUTINY & COMPLIANCE",
        items: [
          { label: "Verification Desk", href: "/verifications", icon: ShieldCheck },
          { label: "Audit Logs Ledger", href: "/audit-logs", icon: ScrollText },
        ],
      },
    ];
  }, [user?.role]);

  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col bg-[#061C18] text-slate-300 shadow-xl border-r border-emerald-950/80 select-none">
      {/* Brand Header */}
      <div className="flex h-18 items-center gap-3 border-b border-emerald-950/90 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-teal-500 text-white shadow-md shadow-emerald-900/50 ring-1 ring-emerald-400/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white tracking-tight">APAAR Portal</p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80 truncate">
            {user?.role === "STUDENT"
              ? "Student Self-Service"
              : user?.role === "INSTITUTION_ADMIN"
              ? "College Management"
              : user?.role === "VERIFICATION_OFFICER"
              ? "Accreditation Scrutiny"
              : "National Academic Platform"}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-1 text-emerald-300/70 hover:bg-emerald-900/60 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Categorized Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 text-xs">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold tracking-widest text-emerald-400/80 uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60 font-semibold ring-1 ring-emerald-400/25"
                        : "text-slate-400 hover:bg-emerald-950/60 hover:text-emerald-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          isActive
                            ? "text-emerald-200"
                            : "text-slate-400 group-hover:text-emerald-300"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-200 shadow-xs" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Session Info */}
      <div className="border-t border-emerald-950/90 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-rose-950/40 hover:text-rose-300 cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
