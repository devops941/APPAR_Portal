import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireRole, AuthError } from "@/lib/auth/guards";
import { Department, Course } from "@/models/Catalog";
import { Student } from "@/models/Student";
import { updateDepartmentSchema } from "@/validators/department";
import { logAudit } from "@/services/audit.service";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/departments/[id]
 * Fetch a single department by ID with counts.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid department ID", "VALIDATION_ERROR", 400);
    }

    const department = await Department.findById(id)
      .populate("institutionId", "name code")
      .lean();

    if (!department) {
      return apiError("Department not found", "NOT_FOUND", 404);
    }

    // Role tenant check
    if (
      session.role === "INSTITUTION_ADMIN" &&
      department.institutionId?._id?.toString() !== session.institutionId
    ) {
      return apiError("Access denied to this institution's department", "FORBIDDEN", 403);
    }

    const [studentCount, courseCount] = await Promise.all([
      Student.countDocuments({ departmentId: id }),
      Course.countDocuments({ departmentId: id }),
    ]);

    return apiSuccess({
      department: {
        ...department,
        studentCount,
        courseCount,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/departments/[id] error:", error);
    return apiError("Failed to fetch department", "INTERNAL_ERROR", 500);
  }
}

/**
 * PATCH /api/departments/[id]
 * Update department details (name, code, hodName).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "INSTITUTION_ADMIN"]);
    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid department ID", "VALIDATION_ERROR", 400);
    }

    const department = await Department.findById(id);
    if (!department) {
      return apiError("Department not found", "NOT_FOUND", 404);
    }

    // Tenant check
    if (
      session.role === "INSTITUTION_ADMIN" &&
      department.institutionId.toString() !== session.institutionId
    ) {
      return apiError("Access denied to this department", "FORBIDDEN", 403);
    }

    const body = await request.json();
    const parsed = updateDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input", "VALIDATION_ERROR", 400);
    }

    const { name, code, hodName } = parsed.data;

    // If code is being changed, check uniqueness within institution
    if (code && code.toUpperCase() !== department.code) {
      const existing = await Department.findOne({
        _id: { $ne: department._id },
        institutionId: department.institutionId,
        code: code.toUpperCase(),
      });
      if (existing) {
        return apiError(`Department code '${code}' already in use in this institution`, "CONFLICT", 409);
      }
      department.code = code.toUpperCase();
    }

    if (name) department.name = name;
    if (hodName !== undefined) department.hodName = hodName || undefined;

    await department.save();

    await logAudit({
      session,
      action: "DEPARTMENT_UPDATED",
      entityType: "Department",
      entityId: department._id.toString(),
      institutionId: department.institutionId.toString(),
      summary: `Updated department ${department.name} (${department.code})`,
      request,
    });

    return apiSuccess({ department });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("PATCH /api/departments/[id] error:", error);
    return apiError("Failed to update department", "INTERNAL_ERROR", 500);
  }
}

/**
 * DELETE /api/departments/[id]
 * Delete a department safely (reject if students or courses are linked).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "INSTITUTION_ADMIN"]);
    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid department ID", "VALIDATION_ERROR", 400);
    }

    const department = await Department.findById(id);
    if (!department) {
      return apiError("Department not found", "NOT_FOUND", 404);
    }

    // Tenant check
    if (
      session.role === "INSTITUTION_ADMIN" &&
      department.institutionId.toString() !== session.institutionId
    ) {
      return apiError("Access denied to this department", "FORBIDDEN", 403);
    }

    // Cascade safety checks
    const [enrolledStudents, linkedCourses] = await Promise.all([
      Student.countDocuments({ departmentId: id }),
      Course.countDocuments({ departmentId: id }),
    ]);

    if (enrolledStudents > 0) {
      return apiError(
        `Cannot delete department: ${enrolledStudents} student(s) are currently enrolled. Reassign or remove students first.`,
        "CASCADE_BLOCK",
        400
      );
    }

    if (linkedCourses > 0) {
      return apiError(
        `Cannot delete department: ${linkedCourses} course program(s) are linked to this department.`,
        "CASCADE_BLOCK",
        400
      );
    }

    await Department.findByIdAndDelete(id);

    await logAudit({
      session,
      action: "DEPARTMENT_DELETED",
      entityType: "Department",
      entityId: id,
      institutionId: department.institutionId.toString(),
      summary: `Deleted academic department ${department.name} (${department.code})`,
      request,
    });

    return apiSuccess({ message: `Department ${department.name} removed successfully` });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("DELETE /api/departments/[id] error:", error);
    return apiError("Failed to delete department", "INTERNAL_ERROR", 500);
  }
}
