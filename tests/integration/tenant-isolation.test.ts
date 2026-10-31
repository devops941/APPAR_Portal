import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireInstitutionScope, AuthError } from "@/lib/auth/guards";
import * as sessionModule from "@/lib/auth/session";

describe("Integration: Multi-Tenant Data Isolation Guard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const COLLEGE_A_ID = "66a0112233445566778899aa";
  const COLLEGE_B_ID = "66b0112233445566778899bb";

  it("should permit Institution Admin to access their own institution resources", async () => {
    const collegeASession: sessionModule.SessionPayload = {
      userId: "usr_admin_college_a",
      email: "admin@college-a.edu.in",
      role: "INSTITUTION_ADMIN",
      institutionId: COLLEGE_A_ID,
    };

    vi.spyOn(sessionModule, "getSession").mockResolvedValue(collegeASession);

    const session = await requireInstitutionScope(COLLEGE_A_ID);
    expect(session.institutionId).toBe(COLLEGE_A_ID);
  });

  it("should block cross-tenant access with 403 when College A Admin attempts to query College B", async () => {
    const collegeASession: sessionModule.SessionPayload = {
      userId: "usr_admin_college_a",
      email: "admin@college-a.edu.in",
      role: "INSTITUTION_ADMIN",
      institutionId: COLLEGE_A_ID,
    };

    vi.spyOn(sessionModule, "getSession").mockResolvedValue(collegeASession);

    await expect(requireInstitutionScope(COLLEGE_B_ID)).rejects.toThrowError(
      "Access denied: You cannot access or modify records of another institution."
    );

    try {
      await requireInstitutionScope(COLLEGE_B_ID);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
      expect((err as AuthError).code).toBe("CROSS_TENANT_FORBIDDEN");
    }
  });

  it("should allow Super Admin to bypass institutional tenant boundary for statutory oversight", async () => {
    const superAdminSession: sessionModule.SessionPayload = {
      userId: "usr_super_admin",
      email: "admin@gmail.com",
      role: "SUPER_ADMIN",
    };

    vi.spyOn(sessionModule, "getSession").mockResolvedValue(superAdminSession);

    // Super admin can access College A, College B, or any tenant
    const resA = await requireInstitutionScope(COLLEGE_A_ID);
    expect(resA.role).toBe("SUPER_ADMIN");

    const resB = await requireInstitutionScope(COLLEGE_B_ID);
    expect(resB.role).toBe("SUPER_ADMIN");
  });
});
