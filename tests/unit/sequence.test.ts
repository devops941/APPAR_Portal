import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNextStudentRollNumber, getNextInstitutionCode, getNextDepartmentCode } from "@/lib/utils/sequence";
import { Student } from "@/models/Student";
import { Department } from "@/models/Catalog";
import { Institution } from "@/models/Institution";

vi.mock("@/models/Student", () => ({
  Student: {
    find: vi.fn(),
  },
}));

vi.mock("@/models/Catalog", () => ({
  Department: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("@/models/Institution", () => ({
  Institution: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
}));

describe("Sequence Generator Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNextStudentRollNumber", () => {
    it("should generate 24CSE001 when no existing students exist in the department", async () => {
      vi.mocked(Department.findById).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ code: "CSE" }),
        }),
      } as any);

      vi.mocked(Student.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const rollNo = await getNextStudentRollNumber({
        institutionId: "inst_123",
        departmentId: "dept_456",
        admissionYear: 2024,
      });

      expect(rollNo).toBe("24CSE001");
    });

    it("should increment next sequence to 24CSE004 when 24CSE003 is highest existing", async () => {
      vi.mocked(Department.findById).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ code: "CSE" }),
        }),
      } as any);

      vi.mocked(Student.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { registerNumber: "24CSE001" },
            { registerNumber: "24CSE002" },
            { registerNumber: "24CSE003" },
          ]),
        }),
      } as any);

      const rollNo = await getNextStudentRollNumber({
        institutionId: "inst_123",
        departmentId: "dept_456",
        admissionYear: 2024,
      });

      expect(rollNo).toBe("24CSE004");
    });

    it("should handle next year rollover correctly (e.g. 2025 -> 25MECH001)", async () => {
      vi.mocked(Department.findById).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ code: "MECH" }),
        }),
      } as any);

      vi.mocked(Student.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const rollNo = await getNextStudentRollNumber({
        institutionId: "inst_123",
        departmentId: "dept_456",
        admissionYear: 2025,
      });

      expect(rollNo).toBe("25MECH001");
    });
  });

  describe("getNextInstitutionCode", () => {
    it("should generate INST-001 when no institutions exist", async () => {
      vi.mocked(Institution.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const code = await getNextInstitutionCode();
      expect(code).toBe("INST-001");
    });

    it("should generate acronym-based code e.g. CIT-001 for Chennai Institute of Technology", async () => {
      vi.mocked(Institution.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.mocked(Institution.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const code = await getNextInstitutionCode("Chennai Institute of Technology");
      expect(code).toBe("CIT-001");
    });
  });

  describe("getNextDepartmentCode", () => {
    it("should map common department names like Artificial Intelligence & Data Science to AIDS", async () => {
      vi.mocked(Department.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const code = await getNextDepartmentCode({
        institutionId: "inst_123",
        name: "Artificial Intelligence & Data Science",
      });

      expect(code).toBe("AIDS");
    });

    it("should generate DEPT-01 when no name is provided and no departments exist", async () => {
      vi.mocked(Department.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const code = await getNextDepartmentCode({
        institutionId: "inst_123",
      });

      expect(code).toBe("DEPT-01");
    });

    it("should map Computer Science & Engineering to CSE", async () => {
      vi.mocked(Department.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const code = await getNextDepartmentCode({
        institutionId: "inst_123",
        name: "Computer Science & Engineering",
      });

      expect(code).toBe("CSE");
    });

    it("should map Mechanical Engineering to MECH", async () => {
      vi.mocked(Department.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const code = await getNextDepartmentCode({
        institutionId: "inst_123",
        name: "Mechanical Engineering",
      });

      expect(code).toBe("MECH");
    });
  });
});
