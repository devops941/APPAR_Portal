"use client";

import React, { useId } from "react";
import { validateIndianMobile } from "@/lib/data/india-geo";
import { CheckCircle2, AlertCircle, Phone } from "lucide-react";

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export function PhoneInput({
  value,
  onChange,
  label = "Contact Phone Number",
  placeholder = "98765 43210",
  required = true,
  disabled = false,
  error,
  helperText,
}: PhoneInputProps) {
  const inputId = useId();

  // Extract raw digits excluding any leading +91
  const rawDigits = value.replace(/\D/g, "");
  const nationalDigits =
    rawDigits.length === 12 && rawDigits.startsWith("91")
      ? rawDigits.slice(2)
      : rawDigits;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric digits, up to 10 characters
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(digitsOnly);
  };

  const isValid = nationalDigits.length === 10 && validateIndianMobile(nationalDigits);
  const isInvalidPrefix =
    nationalDigits.length > 0 && !/^[6-9]/.test(nationalDigits);

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

      <div className="relative flex rounded-xl border border-border shadow-xs transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-600/15 focus-within:border-emerald-600">
        {/* Country Code Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-l-xl border-r border-border bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-sm font-medium text-text select-none">
          <span className="text-base" role="img" aria-label="India Flag">
            🇮🇳
          </span>
          <span className="font-mono text-xs font-semibold text-text-secondary">
            +91
          </span>
        </div>

        {/* Input Field */}
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={nationalDigits}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-r-xl bg-surface px-3 py-2.5 text-sm font-mono tracking-wider outline-none transition-colors ${
            disabled ? "cursor-not-allowed opacity-60 bg-slate-50" : "text-text"
          } ${error ? "border-danger" : ""}`}
        />

        {/* Status Indicator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {nationalDigits.length > 0 ? (
            isValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-in fade-in" />
            ) : isInvalidPrefix ? (
              <AlertCircle className="h-4 w-4 text-danger animate-in fade-in" />
            ) : (
              <span className="text-[11px] font-mono text-text-secondary">
                {nationalDigits.length}/10
              </span>
            )
          ) : (
            <Phone className="h-4 w-4 text-text-secondary/50" />
          )}
        </div>
      </div>

      {/* Validation / Helper Text */}
      {error ? (
        <p className="mt-1 text-xs text-danger flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : isInvalidPrefix ? (
        <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Indian mobile numbers must begin with 6, 7, 8, or 9.
        </p>
      ) : nationalDigits.length > 0 && nationalDigits.length < 10 ? (
        <p className="mt-1 text-[11px] text-amber-600">
          Enter complete 10-digit mobile number ({10 - nationalDigits.length} digits left).
        </p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
