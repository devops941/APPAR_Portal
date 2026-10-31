import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { saveFile, ALLOWED_MIME, MAX_FILE_SIZE } from "@/services/storage.service";
import { env } from "@/lib/env";
import { DocumentModel } from "@/models/Document";
import { AcademicRecord } from "@/models/AcademicRecord";
import { Student } from "@/models/Student";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const studentIdInput = formData.get("studentId") as string | null;
    const academicRecordId = formData.get("academicRecordId") as string | null;
    const semester = formData.get("semester") as string | null;
    const academicYear = formData.get("academicYear") as string | null;

    if (!file) {
      return apiError("No marksheet file provided", "BAD_REQUEST", 400);
    }

    // Extended allowed MIME types including webp
    const allowed = [...ALLOWED_MIME, "image/webp"];
    if (!allowed.includes(file.type)) {
      return apiError(
        `Invalid file type (${file.type}). Allowed: JPG, PNG, WEBP, PDF`,
        "INVALID_FILE_TYPE",
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        `File exceeds maximum size of ${env.MAX_FILE_SIZE_MB}MB`,
        "FILE_TOO_LARGE",
        400
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storageKey, sha256Hash, provider } = await saveFile(buffer, file.name);

    // Compute Cloudinary URL or fallback local URL
    let fileUrl: string;
    if (provider === "cloudinary" && env.CLOUDINARY_CLOUD_NAME) {
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const resourceType = isPdf ? "raw" : "image";
      fileUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${storageKey}`;
    } else {
      fileUrl = `/uploads/${storageKey}`;
    }

    // Resolve student record
    let resolvedStudent = null;
    if (studentIdInput && mongoose.Types.ObjectId.isValid(studentIdInput)) {
      resolvedStudent = await Student.findById(studentIdInput);
    } else if (session.role === "STUDENT") {
      resolvedStudent = await Student.findOne({ userId: session.userId });
    } else if (academicRecordId && mongoose.Types.ObjectId.isValid(academicRecordId)) {
      const rec = await AcademicRecord.findById(academicRecordId);
      if (rec?.studentId) {
        resolvedStudent = await Student.findById(rec.studentId);
      }
    }

    // Create entry in Cryptographic Document Vault
    let documentId: mongoose.Types.ObjectId | undefined;
    if (resolvedStudent) {
      const docTitle = `Semester ${semester || "Examination"} Marksheet (${academicYear || "Official"})`;
      const createdDoc = await DocumentModel.create({
        studentId: resolvedStudent._id,
        institutionId: resolvedStudent.institutionId,
        documentType: "SEMESTER_MARKSHEET",
        title: docTitle,
        originalFileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storageKey,
        storageProvider: provider,
        sha256Hash,
        status: "VERIFIED",
        relatedAcademicRecordId: academicRecordId && mongoose.Types.ObjectId.isValid(academicRecordId)
          ? new mongoose.Types.ObjectId(academicRecordId)
          : undefined,
        uploadedBy: session.userId,
      });
      documentId = createdDoc._id;
    }

    // Attach to existing academic record if specified
    if (academicRecordId && mongoose.Types.ObjectId.isValid(academicRecordId)) {
      await AcademicRecord.findByIdAndUpdate(academicRecordId, {
        marksheetUrl: fileUrl,
        marksheetPublicId: storageKey,
        documentId,
      });
    }

    return apiSuccess({
      url: fileUrl,
      secureUrl: fileUrl,
      publicId: storageKey,
      documentId: documentId?.toString(),
      sha256Hash,
      fileName: file.name,
      fileSize: file.size,
      provider,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/academic-records/upload error:", error);
    return apiError("Failed to upload marksheet document", "INTERNAL_ERROR", 500);
  }
}
