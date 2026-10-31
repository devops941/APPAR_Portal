import { describe, it, expect } from "vitest";
import {
  getAllStates,
  getDistrictsByState,
  getCitiesByState,
  getStateCode,
  validatePincode,
  validateIndianMobile,
  formatIndianPhone,
} from "@/lib/data/india-geo";

describe("India Geo & country-state-city NPM Integration", () => {
  it("should retrieve all 36 Indian States and Union Territories", () => {
    const states = getAllStates();
    expect(states.length).toBe(36);
    expect(states).toContain("Tamil Nadu");
    expect(states).toContain("Karnataka");
    expect(states).toContain("Maharashtra");
    expect(states).toContain("Delhi");
  });

  it("should return the correct ISO state code", () => {
    expect(getStateCode("Tamil Nadu")).toBe("TN");
    expect(getStateCode("Karnataka")).toBe("KA");
    expect(getStateCode("Delhi")).toBe("DL");
  });

  it("should cascade and return statutory districts for Tamil Nadu", () => {
    const tnDistricts = getDistrictsByState("Tamil Nadu");
    expect(tnDistricts.length).toBeGreaterThan(30);
    expect(tnDistricts).toContain("Chennai");
    expect(tnDistricts).toContain("Coimbatore");
    expect(tnDistricts).toContain("Madurai");
    expect(tnDistricts).toContain("Dindigul");
  });

  it("should retrieve dynamic cities using country-state-city package", () => {
    const tnCities = getCitiesByState("Tamil Nadu");
    expect(tnCities.length).toBeGreaterThan(50);
    expect(tnCities.some((c) => c.toLowerCase().includes("chennai") || c.toLowerCase().includes("alandur"))).toBe(true);
  });

  it("should strictly validate 6-digit Indian PIN codes", () => {
    expect(validatePincode("600001")).toBe(true);
    expect(validatePincode("641001")).toBe(true);
    expect(validatePincode("110001")).toBe(true);
    // Invalid cases: cannot start with 0, must be 6 digits
    expect(validatePincode("012345")).toBe(false);
    expect(validatePincode("12345")).toBe(false);
    expect(validatePincode("6000019")).toBe(false);
    expect(validatePincode("abcde1")).toBe(false);
  });

  it("should validate Indian mobile numbers (starts with 6-9, 10 digits)", () => {
    expect(validateIndianMobile("9876543210")).toBe(true);
    expect(validateIndianMobile("8123456789")).toBe(true);
    expect(validateIndianMobile("7012345678")).toBe(true);
    expect(validateIndianMobile("6381234567")).toBe(true);
    expect(validateIndianMobile("+919876543210")).toBe(true);
    expect(validateIndianMobile("+91 98765-43210")).toBe(true);

    // Invalid cases
    expect(validateIndianMobile("5551234567")).toBe(false); // starts with 5
    expect(validateIndianMobile("0987654321")).toBe(false); // starts with 0
    expect(validateIndianMobile("98765")).toBe(false); // incomplete
  });

  it("should format raw phone numbers into standard Indian format", () => {
    expect(formatIndianPhone("9876543210")).toBe("+91 98765-43210");
    expect(formatIndianPhone("+919876543210")).toBe("+91 98765-43210");
  });
});
