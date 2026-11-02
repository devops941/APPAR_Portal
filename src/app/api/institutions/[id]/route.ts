import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireInstitutionScope, AuthError } from "@/lib/auth/guards";
import { Institution } from "@/models/Institution";
import { updateInstitutionSchema } from "@/validators/institution";

/**
 * GET /api/institutions/[id]
 * SUPER_ADMIN or scoped INSTITUTION_ADMIN.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Non-super-admins and non-verification-officers must be scoped to their own institution
    if (session.role !== "SUPER_ADMIN" && session.role !== "VERIFICATION_OFFICER") {
      await requireInstitutionScope(id);
    }

    await connectToDatabase();
    const institution = await Institution.findById(id).lean();

    if (!institution) {
      return apiError("Institution not found", "NOT_FOUND", 404);
    }

    return apiSuccess({ institution });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/institutions/[id] error:", error);
    return apiError("Failed to fetch institution", "INTERNAL_ERROR", 500);
  }
}

/**
 * PATCH /api/institutions/[id]
 * Scoped Institution Admin can update address, contacts, principal details
 * only if status is DRAFT or CORRECTION_REQUIRED.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Institution Admins can only edit their own institution
    if (session.role !== "SUPER_ADMIN") {
      await requireInstitutionScope(id);
    }

    await connectToDatabase();
    const institution = await Institution.findById(id);

    if (!institution) {
      return apiError("Institution not found", "NOT_FOUND", 404);
    }

    // Institution Admins can only edit when in DRAFT or CORRECTION_REQUIRED; Super Admin has statutory authority
    if (session.role !== "SUPER_ADMIN" && !["DRAFT", "CORRECTION_REQUIRED"].includes(institution.status)) {
      return apiError(
        "Institution can only be edited when in DRAFT or CORRECTION_REQUIRED status",
        "INVALID_STATE",
        400
      );
    }

    const body = await request.json();
    const parsed = updateInstitutionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.flatten()
      );
    }

    const updates = parsed.data;
    if (updates.address) {
      institution.address = {
        street: updates.address.street ?? institution.address.street,
        city: updates.address.city ?? institution.address.city,
        district: updates.address.district ?? institution.address.district,
        state: updates.address.state ?? institution.address.state,
        pincode: updates.address.pincode ?? institution.address.pincode,
      };
      delete updates.address;
    }
    if (updates.documents) {
      institution.documents = updates.documents as any;
      institution.markModified("documents");
      delete updates.documents;
    }
    Object.assign(institution, updates);
    await institution.save();

    return apiSuccess({ institution });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("PATCH /api/institutions/[id] error:", error);
    return apiError("Failed to update institution", "INTERNAL_ERROR", 500);
  }
}
