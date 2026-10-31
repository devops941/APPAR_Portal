import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireRole, AuthError } from "@/lib/auth/guards";
import { Department, Course } from "@/models/Catalog";
import { Institution } from "@/models/Institution";
import { Student } from "@/models/Student";
import { createDepartmentSchema } from "@/validators/department";
import { logAudit } from "@/services/audit.service";
import mongoose from "mongoose";

/**
 * GET /api/departments?institutionId=&search=&includeCounts=true
 * Returns departments (filtered by institution or all for super admin).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get("institutionId") || (session.role === "INSTITUTION_ADMIN" ? session.institutionId : undefined);
    const search = searchParams.get("search")?.trim();
    const includeCounts = searchParams.get("includeCounts") === "true";

    const filter: Record<string, unknown> = {};
    if (institutionId) {
      if (mongoose.Types.ObjectId.isValid(institutionId)) {
        filter.institutionId = new mongoose.Types.ObjectId(institutionId);
      } else {
        filter.institutionId = institutionId;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { hodName: { $regex: search, $options: "i" } },
      ];
    }

    let departments = await Department.find(filter)
      .populate<{ institutionId: { _id: string; name: string; code: string } }>("institutionId", "name code")
      .sort({ code: 1 })
      .lean();



    // Attach student & course counts if requested
    if (includeCounts && departments.length > 0) {
      const deptIds = departments.map((d) => d._id);

      const [studentCounts, courseCounts] = await Promise.all([
        Student.aggregate([
          { $match: { departmentId: { $in: deptIds } } },
          { $group: { _id: "$departmentId", count: { $sum: 1 } } },
        ]),
        Course.aggregate([
          { $match: { departmentId: { $in: deptIds } } },
          { $group: { _id: "$departmentId", count: { $sum: 1 } } },
        ]),
      ]);

      const sCountMap = new Map(studentCounts.map((s) => [s._id.toString(), s.count]));
      const cCountMap = new Map(courseCounts.map((c) => [c._id.toString(), c.count]));

      const enriched = departments.map((dept) => ({
        ...dept,
        studentCount: sCountMap.get(dept._id.toString()) || 0,
        courseCount: cCountMap.get(dept._id.toString()) || 0,
      }));

      return apiSuccess({ departments: enriched });
    }

    return apiSuccess({ departments });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/departments error:", error);
    return apiError("Failed to fetch departments", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/departments
 * Create a new academic department.
 * Allowed roles: SUPER_ADMIN, INSTITUTION_ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "INSTITUTION_ADMIN"]);
    await connectToDatabase();

    const body = await request.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input", "VALIDATION_ERROR", 400);
    }

    let { institutionId, name, code, hodName } = parsed.data;

    // Enforce tenant isolation: Institution Admin can only create within their institution
    if (session.role === "INSTITUTION_ADMIN") {
      if (!session.institutionId) {
        return apiError("Institution admin has no associated institution", "FORBIDDEN", 403);
      }
      institutionId = session.institutionId;
    }

    // Verify institution exists
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return apiError("Institution not found", "NOT_FOUND", 404);
    }

    // Check duplicate department code within institution
    const existing = await Department.findOne({
      institutionId,
      code: code.toUpperCase(),
    });
    if (existing) {
      return apiError(`Department code '${code}' already exists in this institution`, "CONFLICT", 409);
    }

    const department = await Department.create({
      institutionId,
      name,
      code: code.toUpperCase(),
      hodName: hodName || undefined,
    });

    await logAudit({
      session,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: department._id.toString(),
      institutionId: institutionId.toString(),
      summary: `Created academic department ${department.name} (${department.code}) in institution ${institution.name}`,
      request,
    });

    return apiSuccess({ department }, undefined, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/departments error:", error);
    return apiError("Failed to create department", "INTERNAL_ERROR", 500);
  }
}
