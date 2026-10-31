import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole, AuthError } from "@/lib/auth/guards";
import * as sessionModule from "@/lib/auth/session";

describe("Integration: Authentication & Role-Based Access Control (RBAC)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw AuthError 401 when no session cookie is provided", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrowError(
      "Authentication required to access this resource"
    );

    try {
      await requireAuth();
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(401);
      expect((err as AuthError).code).toBe("UNAUTHENTICATED");
    }
  });

  it("should succeed and return session payload for valid authenticated user", async () => {
    const mockSession: sessionModule.SessionPayload = {
      userId: "usr_101",
      email: "officer@aicte.gov.in",
      role: "VERIFICATION_OFFICER",
      institutionId: "inst_01",
    };

    vi.spyOn(sessionModule, "getSession").mockResolvedValue(mockSession);

    const session = await requireAuth();
    expect(session).toEqual(mockSession);
    expect(session.role).toBe("VERIFICATION_OFFICER");
  });

  it("should permit authorized roles under requireRole", async () => {
    const mockSession: sessionModule.SessionPayload = {
      userId: "usr_admin",
      email: "admin@gmail.com",
      role: "SUPER_ADMIN",
    };

    vi.spyOn(sessionModule, "getSession").mockResolvedValue(mockSession);

    const session = await requireRole(["SUPER_ADMIN", "VERIFICATION_OFFICER"]);
    expect(session.role).toBe("SUPER_ADMIN");
  });

  it("should throw AuthError 403 when user role is not permitted for endpoint", async () => {
    const mockSession: sessionModule.SessionPayload = {
      userId: "usr_student",
      email: "student@citchennai.edu.in",
      role: "STUDENT",
    };

    vi.spyOn(sessionModule, "getSession").mockResolvedValue(mockSession);

    await expect(
      requireRole(["SUPER_ADMIN", "VERIFICATION_OFFICER"])
    ).rejects.toThrowError("Access denied. Role STUDENT is not permitted.");

    try {
      await requireRole(["SUPER_ADMIN"]);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
      expect((err as AuthError).code).toBe("FORBIDDEN");
    }
  });
});
