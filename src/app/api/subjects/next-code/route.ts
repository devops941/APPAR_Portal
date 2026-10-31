import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { getNextSubjectCode } from "@/lib/utils/sequence";

/**
 * GET /api/subjects/next-code?departmentId=&semester=&category=&name=
 * Dynamically generates the next unique AICTE Subject Code.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const semester = parseInt(searchParams.get("semester") || "1", 10);
    const category = searchParams.get("category") || undefined;
    const suggestedName = searchParams.get("name") || undefined;

    const code = await getNextSubjectCode({
      departmentId: departmentId && departmentId !== "undefined" ? departmentId : undefined,
      semester: isNaN(semester) ? 1 : semester,
      category,
      suggestedName,
    });

    return apiSuccess({ code });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/subjects/next-code error:", error);
    return apiError("Failed to generate subject code", "INTERNAL_ERROR", 500);
  }
}
