"use client";

import React, { useId } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function EmailInput({
  value,
  onChange,
  label = "Email Address",
  placeholder = "registrar@institution.edu.in",
  required = true,
  disabled = false,
  error,
  helperText,
}: EmailInputProps) {
  const inputId = useId();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically sanitize: trim whitespace and lowercase
    const normalized = e.target.value.toLowerCase().replace(/\s+/g, "");
    onChange(normalized);
  };

  const isFormatValid = value ? EMAIL_REGEX.test(value) : false;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
          <Mail className="h-4 w-4 text-emerald-600/70" />
        </div>

        <input
          id={inputId}
          type="email"
          value={value}
          onChange={handleEmailChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm bg-surface transition-all duration-200 outline-none ${
            error
              ? "border-danger focus:ring-2 focus:ring-danger/20"
              : value && isFormatValid
              ? "border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              : "border-border hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          } ${disabled ? "cursor-not-allowed opacity-60 bg-slate-50" : "text-text"}`}
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {value ? (
            isFormatValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-in fade-in" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500 animate-in fade-in" />
            )
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : value && !isFormatValid ? (
        <p className="mt-1 text-[11px] text-amber-600">
          Please enter a valid official institutional email domain (e.g. name@univ.edu.in).
        </p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
