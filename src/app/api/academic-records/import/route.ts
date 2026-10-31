import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { AcademicRecord } from "@/models/AcademicRecord";
import { Student } from "@/models/Student";
import { Subject } from "@/models/Catalog";
import { calculateGradePoint, computeSgpa } from "@/lib/utils/grading";
import { logAudit } from "@/services/audit.service";

interface CsvRow {
  registerNumber: string;
  academicYear: string;
  semester: number | string;
  subjectCode: string;
  marksObtained: number | string;
  subjectName?: string;
  credits?: number | string;
  maxMarks?: number | string;
}

/**
 * POST /api/academic-records/import
 * Imports multiple student marksheet records via batch CSV data.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const { records, rows, institutionId, status = "DRAFT" } = body;

    const dataRows: CsvRow[] = Array.isArray(rows) ? rows : Array.isArray(records) ? records : [];

    if (dataRows.length === 0) {
      return apiError("No marksheet data rows provided for import", "VALIDATION_ERROR", 400);
    }

    const resolvedInstitutionId = institutionId || session.institutionId;

    // Group rows by student + semester + academicYear
    const grouped = new Map<string, {
      registerNumber: string;
      academicYear: string;
      semester: number;
      subjects: CsvRow[];
    }>();

    for (const r of dataRows) {
      const reg = (r.registerNumber || "").toString().trim().toUpperCase();
      const sem = parseInt(r.semester as string);
      const year = (r.academicYear || "2025-2026").toString().trim();
      const code = (r.subjectCode || "").toString().trim().toUpperCase();

      if (!reg || isNaN(sem) || !code) continue;

      const groupKey = `${reg}__${sem}__${year}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          registerNumber: reg,
          academicYear: year,
          semester: sem,
          subjects: [],
        });
      }
      grouped.get(groupKey)!.subjects.push(r);
    }

    if (grouped.size === 0) {
      return apiError("No valid rows found. Please ensure registerNumber, semester, and subjectCode are populated.", "VALIDATION_ERROR", 400);
    }

    const createdRecords: any[] = [];
    const errors: string[] = [];

    // Pre-cache students in this batch
    const registerNumbers = Array.from(new Set(Array.from(grouped.values()).map((g) => g.registerNumber)));
    const studentQuery: any = { registerNumber: { $in: registerNumbers } };
    if (resolvedInstitutionId) studentQuery.institutionId = resolvedInstitutionId;

    const foundStudents = await Student.find(studentQuery).lean();
    const studentMap = new Map(foundStudents.map((s) => [s.registerNumber.toUpperCase(), s]));

    // Pre-cache subjects for catalog lookup
    const allSubjectCodes = Array.from(new Set(dataRows.map((r) => (r.subjectCode || "").toString().trim().toUpperCase())));
    const catalogSubjects = await Subject.find({ code: { $in: allSubjectCodes } }).lean();
    const subjectMap = new Map(catalogSubjects.map((s) => [s.code.toUpperCase(), s]));

    for (const [key, group] of grouped.entries()) {
      const student = studentMap.get(group.registerNumber);
      if (!student) {
        errors.push(`Student with Register No "${group.registerNumber}" not found in institutional registry.`);
        continue;
      }

      // Compute grades for all subjects in this semester for this student
      const subjectsWithGrades = group.subjects.map((subRow) => {
        const code = (subRow.subjectCode || "").toString().trim().toUpperCase();
        const catalogSub = subjectMap.get(code);

        const marksObtained = Math.min(100, Math.max(0, Number(subRow.marksObtained) || 0));
        const maxMarks = Number(subRow.maxMarks) || catalogSub?.maxMarks || 100;
        const credits = Number(subRow.credits) || catalogSub?.credits || 3;
        const name = subRow.subjectName || catalogSub?.name || code;

        const percentage = (marksObtained / maxMarks) * 100;
        const { grade, gradePoint, result } = calculateGradePoint(percentage);

        return {
          subjectId: catalogSub?._id ? catalogSub._id : undefined,
          subjectCode: code,
          subjectName: name,
          credits,
          marksObtained,
          maxMarks,
          grade,
          gradePoint,
          result,
        };
      });

      const { totalCredits, sgpa } = computeSgpa(subjectsWithGrades);

      try {
        const record = await AcademicRecord.findOneAndUpdate(
          {
            studentId: student._id,
            semester: group.semester,
            academicYear: group.academicYear,
          },
          {
            $set: {
              institutionId: student.institutionId,
              subjects: subjectsWithGrades,
              totalCredits,
              sgpa,
              status: status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
              submittedBy: session.userId,
              submittedAt: new Date(),
            },
            $inc: { version: 1 },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        createdRecords.push({
          registerNumber: student.registerNumber,
          fullName: student.fullName,
          semester: group.semester,
          sgpa,
          subjectsCount: subjectsWithGrades.length,
          recordId: record._id,
        });
      } catch (saveErr: any) {
        errors.push(`Failed to save mark sheet for ${group.registerNumber} (Sem ${group.semester}): ${saveErr.message}`);
      }
    }

    if (createdRecords.length > 0) {
      await logAudit({
        session,
        action: "ACADEMIC_RECORD_SUBMITTED",
        entityType: "AcademicRecord",
        entityId: createdRecords[0]?.recordId?.toString() || "BATCH",
        institutionId: resolvedInstitutionId?.toString(),
        summary: `Batch imported marksheets for ${createdRecords.length} students via CSV`,
        request,
      });
    }

    return apiSuccess(
      {
        totalStudentsProcessed: createdRecords.length,
        totalRowsParsed: dataRows.length,
        records: createdRecords,
        errors,
      },
      undefined,
      200
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/academic-records/import error:", error);
    return apiError("Failed to import academic records", "INTERNAL_ERROR", 500);
  }
}
