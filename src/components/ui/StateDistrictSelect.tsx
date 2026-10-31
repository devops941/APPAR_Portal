"use client";

import React, { useMemo } from "react";
import {
  getAllStates,
  getDistrictsByState,
  getCitiesByState,
  validatePincode,
} from "@/lib/data/india-geo";
import { MapPin, Navigation, Building2, CheckCircle2, AlertCircle } from "lucide-react";

export interface StateDistrictSelectProps {
  selectedState: string;
  selectedDistrict: string;
  selectedCity?: string;
  pincode?: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onCityChange?: (city: string) => void;
  onPincodeChange?: (pincode: string) => void;
  disabled?: boolean;
  required?: boolean;
  showCity?: boolean;
  showPincode?: boolean;
  errors?: {
    state?: string;
    district?: string;
    city?: string;
    pincode?: string;
  };
}

export function StateDistrictSelect({
  selectedState,
  selectedDistrict,
  selectedCity = "",
  pincode = "",
  onStateChange,
  onDistrictChange,
  onCityChange,
  onPincodeChange,
  disabled = false,
  required = true,
  showCity = true,
  showPincode = true,
  errors = {},
}: StateDistrictSelectProps) {
  // All 36 States & UTs from country-state-city
  const stateList = useMemo(() => getAllStates(), []);

  // Filtered districts for selected state
  const districtList = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsByState(selectedState);
  }, [selectedState]);

  // Cities from country-state-city for selected state
  const cityList = useMemo(() => {
    if (!selectedState) return [];
    return getCitiesByState(selectedState);
  }, [selectedState]);

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    onStateChange(newState);
    // Reset dependent district and city when state changes
    onDistrictChange("");
    if (onCityChange) onCityChange("");
  };

  const handlePincodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onPincodeChange) return;
    const cleanDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
    onPincodeChange(cleanDigits);
  };

  const isPincodeValid = pincode ? validatePincode(pincode) : false;

  return (
    <div className="space-y-4">
      {/* Row 1: State & District Cascade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            State / UT {required && <span className="text-danger">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={handleStateSelect}
              disabled={disabled}
              className={`w-full rounded-xl border appearance-none px-3.5 py-2.5 text-sm bg-surface transition-all duration-200 outline-none pr-9 ${
                errors.state
                  ? "border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-border hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "text-text cursor-pointer"}`}
            >
              <option value="">-- Select State / UT --</option>
              {stateList.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          {errors.state && (
            <p className="mt-1 text-xs text-danger flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.state}
            </p>
          )}
        </div>

        {/* District Dropdown (Cascaded) */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            District {required && <span className="text-danger">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              disabled={disabled || !selectedState}
              className={`w-full rounded-xl border appearance-none px-3.5 py-2.5 text-sm bg-surface transition-all duration-200 outline-none pr-9 ${
                errors.district
                  ? "border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-border hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              } ${
                disabled || !selectedState
                  ? "opacity-50 cursor-not-allowed bg-slate-50 text-text-secondary"
                  : "text-text cursor-pointer"
              }`}
            >
              <option value="">
                {!selectedState
                  ? "-- Choose State First --"
                  : districtList.length === 0
                  ? "-- No Districts Found --"
                  : `-- Select District (${districtList.length}) --`}
              </option>
              {districtList.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary">
              <Navigation className="h-4 w-4 text-teal-600" />
            </div>
          </div>
          {errors.district && (
            <p className="mt-1 text-xs text-danger flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.district}
            </p>
          )}
          {!selectedState && (
            <p className="mt-1 text-[11px] text-text-secondary">
              Selecting a State auto-populates its official districts.
            </p>
          )}
        </div>
      </div>

      {/* Row 2: City (with country-state-city datalist) & 6-Digit PIN Code */}
      {(showCity || showPincode) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showCity && onCityChange && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                City / Municipality {required && <span className="text-danger">*</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="city-datalist-options"
                  value={selectedCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  placeholder={
                    selectedState
                      ? "Search or type city..."
                      : "Type city or town..."
                  }
                  disabled={disabled}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-surface transition-all duration-200 outline-none pr-9 ${
                    errors.city
                      ? "border-danger focus:ring-2 focus:ring-danger/20"
                      : "border-border hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "text-text"}`}
                />
                <datalist id="city-datalist-options">
                  {cityList.slice(0, 80).map((cityName) => (
                    <option key={cityName} value={cityName} />
                  ))}
                </datalist>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary">
                  <Building2 className="h-4 w-4 text-emerald-600/70" />
                </div>
              </div>
              {errors.city && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.city}
                </p>
              )}
            </div>
          )}

          {showPincode && onPincodeChange && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                PIN Code (Postal Code) {required && <span className="text-danger">*</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={handlePincodeInput}
                  placeholder="6-digit PIN (e.g. 600001)"
                  disabled={disabled}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-surface transition-all duration-200 outline-none pr-10 tracking-widest font-mono ${
                    errors.pincode
                      ? "border-danger focus:ring-2 focus:ring-danger/20"
                      : pincode && isPincodeValid
                      ? "border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                      : "border-border hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "text-text"}`}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {pincode ? (
                    isPincodeValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )
                  ) : (
                    <span className="text-[11px] font-mono text-text-secondary/60">IND</span>
                  )}
                </div>
              </div>
              {errors.pincode ? (
                <p className="mt-1 text-xs text-danger flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.pincode}
                </p>
              ) : pincode && !isPincodeValid ? (
                <p className="mt-1 text-[11px] text-amber-600">
                  PIN code must be a valid 6-digit postal code (cannot begin with 0).
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
