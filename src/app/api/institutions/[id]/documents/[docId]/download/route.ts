import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Institution } from "@/models/Institution";
import { getFileBuffer } from "@/services/storage.service";
import { logAudit } from "@/services/audit.service";

/**
 * GET /api/institutions/[id]/documents/[docId]/download
 * Streams the statutory document with proper Content-Type and inline disposition for lightbox preview.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const session = await requireAuth();
    await connectToDatabase();

    const institution = await Institution.findById(id);
    if (!institution) {
      return apiError("Institution not found", "NOT_FOUND", 404);
    }

    // Role-based verification scoping
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isVerificationOfficer = session.role === "VERIFICATION_OFFICER";
    const isInstitutionalMember = session.institutionId === institution._id.toString();

    if (!isSuperAdmin && !isVerificationOfficer && !isInstitutionalMember) {
      return apiError("You do not have statutory clearance to view this institutional document", "FORBIDDEN", 403);
    }

    const doc = institution.documents?.find(
      (d) => d._id?.toString() === docId || d.storageKey === docId
    );

    if (!doc) {
      return apiError("Statutory document not found in institution record", "NOT_FOUND", 404);
    }

    const buffer = await getFileBuffer(doc.storageKey, doc.storageProvider);

    await logAudit({
      session,
      action: "DOCUMENT_DOWNLOADED",
      entityType: "Institution",
      entityId: institution._id.toString(),
      institutionId: institution._id.toString(),
      summary: `Viewed/Downloaded statutory document "${doc.title}" (${doc.documentType})`,
      request,
    });

    let mimeType = doc.mimeType || "application/octet-stream";
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      mimeType = "image/png";
    } else if (
      buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      mimeType = "application/pdf";
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFileName)}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/institutions/[id]/documents/[docId]/download error:", error);
    return apiError("Failed to stream institutional document", "INTERNAL_ERROR", 500);
  }
}
