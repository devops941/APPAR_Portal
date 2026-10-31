import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileEdit, ShieldCheck } from "lucide-react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-50 text-slate-600 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  info: "bg-teal-50 text-teal-700 border-teal-200/80",
  primary: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusVariantMap: Record<string, BadgeVariant> = {
  VERIFIED: "success",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  REJECTED: "danger",
  CORRECTION_REQUIRED: "warning",
  DRAFT: "default",
  PENDING: "warning",
  ACTIVE: "success",
  GRADUATED: "info",
  TRANSFERRED: "warning",
  WITHDRAWN: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariantMap[status] ?? "default";
  const label = status ? status.replace(/_/g, " ") : "Unknown";

  let Icon = CheckCircle2;
  if (variant === "success") Icon = ShieldCheck;
  else if (variant === "warning") Icon = Clock;
  else if (variant === "danger") Icon = XCircle;
  else if (variant === "default") Icon = FileEdit;

  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3" />
      <span>{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</span>
    </Badge>
  );
}
