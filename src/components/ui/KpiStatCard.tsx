import React from "react";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type KpiTheme = "default" | "emerald" | "amber" | "indigo" | "rose";

interface KpiStatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  change?: string;
  trend?: "up" | "down" | "neutral" | string;
  icon: React.ComponentType<{ className?: string }>;
  theme?: KpiTheme;
  className?: string;
}

const themeStyles: Record<
  KpiTheme,
  {
    border: string;
    iconBg: string;
    iconText: string;
    labelColor: string;
  }
> = {
  default: {
    border: "border-slate-200/90 hover:border-slate-300",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    labelColor: "text-slate-500",
  },
  emerald: {
    border: "border-emerald-200 hover:border-emerald-300",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    labelColor: "text-emerald-700",
  },
  amber: {
    border: "border-amber-200 hover:border-amber-300",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    labelColor: "text-amber-700",
  },
  indigo: {
    border: "border-teal-200 hover:border-teal-300",
    iconBg: "bg-teal-50",
    iconText: "text-teal-600",
    labelColor: "text-teal-700",
  },
  rose: {
    border: "border-rose-200 hover:border-rose-300",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    labelColor: "text-rose-700",
  },
};

export function KpiStatCard({
  label,
  value,
  subtext,
  change,
  trend,
  icon: Icon,
  theme = "default",
  className,
}: KpiStatCardProps) {
  const styles = themeStyles[theme];
  const displaySub = change || subtext;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md",
        styles.border,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-[11px] font-bold tracking-wider uppercase", styles.labelColor)}>
          {label}
        </p>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            styles.iconBg,
            styles.iconText
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>

        {displaySub && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
            {trend === "neutral" && <Minus className="h-3 w-3 text-slate-400 shrink-0" />}
            <span
              className={cn(
                "line-clamp-1 font-medium",
                trend === "up" && "text-emerald-700 font-semibold",
                trend === "down" && "text-amber-700 font-semibold"
              )}
            >
              {displaySub}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
