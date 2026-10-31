import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Subject } from "@/models/Catalog";

/**
 * GET /api/subjects/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await connectToDatabase();
    const { id } = await params;

    const subject = await Subject.findById(id)
      .populate("departmentId", "name code")
      .populate("institutionId", "name code")
      .lean();

    if (!subject) {
      return apiError("Subject not found", "NOT_FOUND", 404);
    }

    return apiSuccess({ subject });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/subjects/[id] error:", error);
    return apiError("Failed to fetch subject", "INTERNAL_ERROR", 500);
  }
}

/**
 * PUT /api/subjects/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const subject = await Subject.findById(id);
    if (!subject) {
      return apiError("Subject not found", "NOT_FOUND", 404);
    }

    const {
      name,
      code,
      semester,
      category,
      lectureHours,
      tutorialHours,
      practicalHours,
      credits,
      internalMarks,
      externalMarks,
      maxMarks,
      type,
      syllabusOutline,
      isElective,
    } = body;

    if (name) subject.name = name.trim();
    if (code) subject.code = code.toUpperCase().trim();
    if (semester !== undefined) subject.semester = Number(semester);
    if (category) subject.category = category;
    if (lectureHours !== undefined) subject.lectureHours = Number(lectureHours);
    if (tutorialHours !== undefined) subject.tutorialHours = Number(tutorialHours);
    if (practicalHours !== undefined) subject.practicalHours = Number(practicalHours);
    if (credits !== undefined) subject.credits = Number(credits);
    if (internalMarks !== undefined) subject.internalMarks = Number(internalMarks);
    if (externalMarks !== undefined) subject.externalMarks = Number(externalMarks);
    if (maxMarks !== undefined) subject.maxMarks = Number(maxMarks);
    if (type) subject.type = type;
    if (syllabusOutline !== undefined) subject.syllabusOutline = syllabusOutline;
    if (isElective !== undefined) subject.isElective = Boolean(isElective);

    await subject.save();

    return apiSuccess({ subject });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("PUT /api/subjects/[id] error:", error);
    return apiError("Failed to update subject", "INTERNAL_ERROR", 500);
  }
}

/**
 * DELETE /api/subjects/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await connectToDatabase();
    const { id } = await params;

    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted) {
      return apiError("Subject not found", "NOT_FOUND", 404);
    }

    return apiSuccess({ id, deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("DELETE /api/subjects/[id] error:", error);
    return apiError("Failed to delete subject", "INTERNAL_ERROR", 500);
  }
}
