import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { getNextDepartmentCode } from "@/lib/utils/sequence";
import mongoose from "mongoose";

/**
 * GET /api/departments/next-code?institutionId=&name=
 * Returns the recommended or sequential department code.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get("institutionId");
    const name = searchParams.get("name") || undefined;

    if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
      return apiError("Valid institutionId is required", "VALIDATION_ERROR", 400);
    }

    const nextCode = await getNextDepartmentCode({
      institutionId,
      name,
    });

    return apiSuccess({ nextCode });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/departments/next-code error:", error);
    return apiError("Failed to calculate next department code", "INTERNAL_ERROR", 500);
  }
}
