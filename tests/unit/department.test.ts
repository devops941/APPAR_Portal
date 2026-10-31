import { describe, it, expect } from "vitest";
import { createDepartmentSchema, updateDepartmentSchema } from "@/validators/department";

describe("Department Validator Unit Tests", () => {
  it("should successfully validate valid department creation input", () => {
    const input = {
      institutionId: "64e0a1b2c3d4e5f6a7b8c9d0",
      name: "Computer Science and Engineering",
      code: "CSE",
      hodName: "Dr. K. Senthil Kumar",
    };

    const result = createDepartmentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("CSE");
      expect(result.data.name).toBe("Computer Science and Engineering");
    }
  });

  it("should automatically uppercase department codes", () => {
    const input = {
      institutionId: "64e0a1b2c3d4e5f6a7b8c9d0",
      name: "Mechanical Engineering",
      code: "mech",
    };

    const result = createDepartmentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("MECH");
    }
  });

  it("should reject invalid department code with special symbols", () => {
    const input = {
      institutionId: "64e0a1b2c3d4e5f6a7b8c9d0",
      name: "Information Technology",
      code: "IT@2026",
    };

    const result = createDepartmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject too short department code or name", () => {
    const input = {
      institutionId: "64e0a1b2c3d4e5f6a7b8c9d0",
      name: "CS",
      code: "C",
    };

    const result = createDepartmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should validate partial update department schema", () => {
    const updateInput = {
      hodName: "Dr. A. Ramesh",
    };

    const result = updateDepartmentSchema.safeParse(updateInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hodName).toBe("Dr. A. Ramesh");
    }
  });
});
