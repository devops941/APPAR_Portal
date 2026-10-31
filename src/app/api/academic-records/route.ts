import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireInstitutionScope, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { AcademicRecord } from "@/models/AcademicRecord";
import { createAcademicRecordSchema } from "@/validators/academic";
import { calculateGradePoint, computeSgpa } from "@/lib/utils/grading";

import { Student } from "@/models/Student";
import { DocumentModel } from "@/models/Document";

/**
 * GET /api/academic-records?studentId=&semester=
 * Returns records scoped to student or institution.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const semester = searchParams.get("semester");
    const institutionId = searchParams.get("institutionId");

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (semester) filter.semester = parseInt(semester);
    if (institutionId) filter.institutionId = institutionId;

    // Student role scoping: students only see their own verified/submitted records
    if (session.role === "STUDENT") {
      const student = await Student.findOne({ userId: session.userId }).select("_id");
      if (student) {
        filter.studentId = student._id;
      } else {
        filter.studentId = new mongoose.Types.ObjectId();
      }
    } else if (session.role !== "SUPER_ADMIN" && session.role !== "VERIFICATION_OFFICER" && session.institutionId) {
      // Tenant scoping for institution-level staff
      filter.institutionId = session.institutionId;
    }

    const records = await AcademicRecord.find(filter)
      .populate("studentId", "fullName registerNumber apaarId departmentId")
      .populate("institutionId", "name code")
      .sort({ createdAt: -1, semester: 1, version: -1 })
      .lean();

    // Check and resolve any marksheet scan linked via DocumentModel
    const recordIdsWithoutScan = records.filter((r) => !r.marksheetUrl).map((r) => r._id);
    if (recordIdsWithoutScan.length > 0) {
      const docIds = records.filter((r) => r.documentId).map((r) => r.documentId);
      const orClauses: Record<string, unknown>[] = [{ relatedAcademicRecordId: { $in: recordIdsWithoutScan } }];
      if (docIds.length > 0) {
        orClauses.push({ _id: { $in: docIds } });
      }

      const linkedDocs = await DocumentModel.find({ $or: orClauses }).lean();

      const docMap = new Map();
      for (const doc of linkedDocs) {
        if (doc.relatedAcademicRecordId) {
          docMap.set(doc.relatedAcademicRecordId.toString(), doc);
        }
        docMap.set(doc._id.toString(), doc);
      }

      for (const rec of records) {
        if (!rec.marksheetUrl) {
          const matchedDoc =
            docMap.get(rec._id.toString()) ||
            (rec.documentId ? docMap.get(rec.documentId.toString()) : null);
          if (matchedDoc) {
            rec.marksheetUrl = `/api/documents/${matchedDoc._id}/download`;
            rec.documentId = matchedDoc._id;
          }
        }
      }
    }

    return apiSuccess({ records });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/academic-records error:", error);
    return apiError("Failed to fetch academic records", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/academic-records
 * Creates a draft marksheet. Auto-computes grade points and SGPA server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const parsed = createAcademicRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    // Students cannot create or issue academic records
    if (session.role === "STUDENT") {
      return apiError("Students are not permitted to issue academic records", "FORBIDDEN", 403);
    }

    // Scope check
    if (session.role !== "SUPER_ADMIN") {
      await requireInstitutionScope(data.institutionId);
    }

    // Compute grades and SGPA server-side (never trust client calculations)
    const subjectsWithGrades = data.subjects.map((s) => {
      const maxMarks = s.maxMarks || 100;
      const percentage = (s.marksObtained / maxMarks) * 100;
      const { grade, gradePoint, result } = calculateGradePoint(percentage);
      return {
        subjectId: s.subjectId && mongoose.Types.ObjectId.isValid(s.subjectId)
          ? new mongoose.Types.ObjectId(s.subjectId)
          : undefined,
        subjectCode: s.subjectCode.toUpperCase().trim(),
        subjectName: s.subjectName.trim(),
        credits: s.credits,
        marksObtained: s.marksObtained,
        maxMarks,
        grade,
        gradePoint,
        result,
      };
    });

    const { totalCredits, sgpa } = computeSgpa(subjectsWithGrades);

    // Check for existing draft for this semester
    const existing = await AcademicRecord.findOne({
      studentId: data.studentId,
      semester: data.semester,
      status: "DRAFT",
    });

    if (existing) {
      // Update existing draft
      existing.subjects = subjectsWithGrades;
      existing.totalCredits = totalCredits;
      existing.sgpa = sgpa;
      existing.academicYear = data.academicYear;
      if (data.marksheetUrl) existing.marksheetUrl = data.marksheetUrl;
      if (data.marksheetPublicId) existing.marksheetPublicId = data.marksheetPublicId;
      if (data.documentId) existing.documentId = new mongoose.Types.ObjectId(data.documentId);
      await existing.save();

      await logAudit({
        session,
        action: "ACADEMIC_RECORD_SUBMITTED",
        entityType: "AcademicRecord",
        entityId: existing._id.toString(),
        institutionId: data.institutionId,
        summary: `Updated draft record for semester ${data.semester} (SGPA: ${sgpa})`,
        request,
      });

      return apiSuccess({ record: existing });
    }

    // Create new draft
    const record = await AcademicRecord.create({
      studentId: data.studentId,
      institutionId: data.institutionId,
      academicYear: data.academicYear,
      semester: data.semester,
      subjects: subjectsWithGrades,
      totalCredits,
      sgpa,
      marksheetUrl: data.marksheetUrl,
      marksheetPublicId: data.marksheetPublicId,
      documentId: data.documentId ? new mongoose.Types.ObjectId(data.documentId) : undefined,
      status: "DRAFT",
      version: 1,
    });

    await logAudit({
      session,
      action: "ACADEMIC_RECORD_SUBMITTED",
      entityType: "AcademicRecord",
      entityId: record._id.toString(),
      institutionId: data.institutionId,
      summary: `Created draft record for semester ${data.semester} (SGPA: ${sgpa})`,
      request,
    });

    return apiSuccess({ record }, undefined, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/academic-records error:", error);
    return apiError("Failed to create academic record", "INTERNAL_ERROR", 500);
  }
}
