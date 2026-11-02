import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { getFileBuffer } from "@/services/storage.service";

/**
 * GET /api/institutions/preview?key=<storageKey>&provider=<provider>&name=<name>
 * Streams any uploaded statutory institution document (PDF or Image) inline
 * for instant lightbox viewing and preview with zero 404s.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const storageKey = searchParams.get("key");
    const rawProvider = searchParams.get("provider") || "cloudinary";
    const originalFileName = searchParams.get("name") || "document";

    if (!storageKey) {
      return apiError("Missing document storage key", "VALIDATION_ERROR", 400);
    }

    const provider: "cloudinary" | "local" =
      rawProvider === "local" ? "local" : "cloudinary";

    const buffer = await getFileBuffer(storageKey, provider);

    let mimeType = "application/octet-stream";
    const lowerName = originalFileName.toLowerCase();

    if (
      (buffer.length >= 4 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47) ||
      lowerName.endsWith(".png")
    ) {
      mimeType = "image/png";
    } else if (
      (buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff) ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg")
    ) {
      mimeType = "image/jpeg";
    } else if (
      (buffer.length >= 4 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46) ||
      lowerName.endsWith(".pdf")
    ) {
      mimeType = "application/pdf";
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(originalFileName)}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/institutions/preview error:", error);
    return apiError("Failed to stream document preview", "INTERNAL_ERROR", 500);
  }
}

