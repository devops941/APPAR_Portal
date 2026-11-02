import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { saveFile, ALLOWED_MIME, MAX_FILE_SIZE } from "@/services/storage.service";
import { env } from "@/lib/env";
import { INSTITUTION_DOCUMENT_TYPES, type InstitutionDocumentType } from "@/models/Institution";

/**
 * POST /api/institutions/upload
 * Handles uploading a statutory document for an institution to Cloudinary (or local fallback).
 * Returns the stored document metadata (storageKey, sha256, Cloudinary url, etc.).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only administrators or officers can upload statutory institution credentials
    if (!["SUPER_ADMIN", "INSTITUTION_ADMIN", "VERIFICATION_OFFICER"].includes(session.role)) {
      return apiError("Unauthorized to upload institution statutory documents", "FORBIDDEN", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) || "";
    const rawDocType = (formData.get("documentType") as string | null) || "OTHER";

    if (!file) {
      return apiError("No document file was provided in the upload request", "VALIDATION_ERROR", 400);
    }

    // Validate MIME type
    if (!ALLOWED_MIME.includes(file.type)) {
      return apiError(
        `File format "${file.type}" is not supported. Permitted formats: PDF, PNG, JPEG.`,
        "INVALID_FILE_TYPE",
        400
      );
    }

    // Validate file size limit
    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        `File size exceeds statutory maximum of ${env.MAX_FILE_SIZE_MB}MB`,
        "FILE_TOO_LARGE",
        400
      );
    }

    const docType: InstitutionDocumentType = INSTITUTION_DOCUMENT_TYPES.includes(
      rawDocType as InstitutionDocumentType
    )
      ? (rawDocType as InstitutionDocumentType)
      : "OTHER";

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storageKey, sha256Hash, provider, url } = await saveFile(buffer, file.name);

    // Guaranteed preview stream URL fallback
    const streamUrl = `/api/institutions/preview?key=${encodeURIComponent(storageKey)}&provider=${provider}&name=${encodeURIComponent(file.name)}`;
    const effectiveUrl = url || streamUrl;

    const documentData = {
      title: title.trim() || file.name,
      documentType: docType,
      originalFileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      storageKey,
      storageProvider: provider,
      sha256Hash,
      url: effectiveUrl,
      uploadedAt: new Date().toISOString(),
    };

    return apiSuccess({ document: documentData }, undefined, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/institutions/upload error:", error);
    return apiError("Failed to upload statutory institution document", "INTERNAL_ERROR", 500);
  }
}

