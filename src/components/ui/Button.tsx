import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "warning" | "success" | "ghost" | "outline";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99]",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs active:scale-[0.99]",
  outline: "border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300",
  danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:scale-[0.99]",
  warning: "bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.99]",
  success: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99]",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg font-medium",
    md: "px-4 py-2 text-xs font-semibold rounded-xl",
    lg: "px-5 py-2.5 text-sm font-semibold rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
