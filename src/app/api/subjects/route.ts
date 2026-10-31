import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Subject, Department } from "@/models/Catalog";
import { Institution } from "@/models/Institution";

/**
 * GET /api/subjects?departmentId=&semester=&institutionId=&search=
 * Returns subjects catalog matching filters.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const semester = searchParams.get("semester");
    const institutionId = searchParams.get("institutionId");
    const category = searchParams.get("category");
    const academicYear = searchParams.get("academicYear");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (departmentId && departmentId !== "undefined" && departmentId !== "null" && departmentId.trim() !== "") {
      filter.departmentId = departmentId.trim();
    }
    if (semester && !isNaN(parseInt(semester))) filter.semester = parseInt(semester);
    if (category && category !== "All") filter.category = category.toUpperCase().trim();
    if (academicYear && academicYear !== "All") filter.academicYear = academicYear.trim();
    if (institutionId && institutionId !== "undefined" && institutionId !== "null" && institutionId !== "All") {
      filter.institutionId = institutionId;
    } else if (session.role !== "SUPER_ADMIN" && session.role !== "VERIFICATION_OFFICER" && session.institutionId) {
      filter.institutionId = session.institutionId;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ code: regex }, { name: regex }];
    }

    // Ensure referenced schemas are registered for Mongoose populate
    void Department;
    void Institution;

    const subjects = await Subject.find(filter)
      .populate({ path: "departmentId", select: "name code", strictPopulate: false })
      .populate({ path: "institutionId", select: "name code", strictPopulate: false })
      .sort({ semester: 1, category: 1, code: 1 })
      .lean();

    return apiSuccess({ subjects });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/subjects error:", error);
    return apiError("Failed to fetch subjects", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/subjects
 * Creates a single AICTE subject in the catalog.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const {
      departmentId,
      semester,
      academicYear = "2025-2026",
      code,
      name,
      category = "PCC",
      lectureHours = 3,
      tutorialHours = 0,
      practicalHours = 0,
      credits,
      internalMarks = 40,
      externalMarks = 60,
      maxMarks = 100,
      type = "THEORY",
      regulationYear = "AICTE-2024",
      syllabusOutline,
      isElective = false,
      institutionId,
    } = body;

    if (!code || !name || !semester) {
      return apiError("Missing required subject fields: code, name, semester", "VALIDATION_ERROR", 400);
    }

    // Auto-compute credits if not explicitly specified: L + T/2 + P/2
    const computedCredits =
      credits !== undefined && !isNaN(Number(credits))
        ? Number(credits)
        : Number(lectureHours) + Math.ceil(Number(tutorialHours) / 2) + Math.ceil(Number(practicalHours) / 2);

    const resolvedInstitutionId = institutionId || session.institutionId;

    // Check for duplicate code in this department and semester
    const existing = await Subject.findOne({
      departmentId: departmentId || undefined,
      semester: Number(semester),
      code: code.toUpperCase().trim(),
    });

    if (existing) {
      return apiError(
        `Subject code "${code.toUpperCase()}" already exists for semester ${semester}`,
        "DUPLICATE_CODE",
        409
      );
    }

    const subject = await Subject.create({
      institutionId: resolvedInstitutionId,
      departmentId: departmentId || undefined,
      academicYear: academicYear || "2025-2026",
      semester: Number(semester),
      code: code.toUpperCase().trim(),
      name: name.trim(),
      category,
      lectureHours: Number(lectureHours),
      tutorialHours: Number(tutorialHours),
      practicalHours: Number(practicalHours),
      credits: computedCredits,
      internalMarks: Number(internalMarks),
      externalMarks: Number(externalMarks),
      maxMarks: Number(maxMarks),
      type: type || (Number(practicalHours) > 0 ? "PRACTICAL" : "THEORY"),
      regulationYear: regulationYear || "AICTE-2024",
      syllabusOutline: syllabusOutline || undefined,
      isElective: Boolean(isElective),
    });

    return apiSuccess({ subject }, undefined, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/subjects error:", error);
    return apiError("Failed to create subject", "INTERNAL_ERROR", 500);
  }
}
