import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { getNextStudentRollNumber } from "@/lib/utils/sequence";
import mongoose from "mongoose";

/**
 * GET /api/students/next-roll-no?institutionId=&departmentId=&admissionYear=
 * Returns the next unique, sequential roll number for a student.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get("institutionId");
    const departmentId = searchParams.get("departmentId");
    const admissionYearStr = searchParams.get("admissionYear");

    if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
      return apiError("Valid institutionId is required", "VALIDATION_ERROR", 400);
    }

    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return apiError("Valid departmentId is required", "VALIDATION_ERROR", 400);
    }

    const admissionYear = admissionYearStr ? parseInt(admissionYearStr, 10) : new Date().getFullYear();
    if (isNaN(admissionYear) || admissionYear < 2000 || admissionYear > 2100) {
      return apiError("Valid admissionYear is required", "VALIDATION_ERROR", 400);
    }

    const nextRollNo = await getNextStudentRollNumber({
      institutionId,
      departmentId,
      admissionYear,
    });

    return apiSuccess({ nextRollNo });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/students/next-roll-no error:", error);
    return apiError("Failed to calculate next roll number", "INTERNAL_ERROR", 500);
  }
}
