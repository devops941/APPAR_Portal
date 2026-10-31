import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { getNextInstitutionCode } from "@/lib/utils/sequence";

/**
 * GET /api/institutions/next-code?name=
 * Returns the next available unique Institution code.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || undefined;

    const nextCode = await getNextInstitutionCode(name);
    return apiSuccess({ nextCode });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/institutions/next-code error:", error);
    return apiError("Failed to calculate next institution code", "INTERNAL_ERROR", 500);
  }
}
