import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Subject } from "@/models/Catalog";

/**
 * POST /api/subjects/bulk
 * Bulk creates or updates curriculum subjects (from CSV upload or batch form).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const { subjects, departmentId, institutionId } = body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return apiError("A non-empty list of subjects is required", "VALIDATION_ERROR", 400);
    }

    const resolvedInstitutionId = institutionId || session.institutionId;
    let insertedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      const deptId = s.departmentId || departmentId;
      const sem = Number(s.semester);
      const code = s.code ? s.code.toString().toUpperCase().trim() : "";
      const name = s.name ? s.name.toString().trim() : "";
      const credits = Number(s.credits);
      const category = s.category ? s.category.toString().toUpperCase().trim() : "PCC";
      const L = Number(s.lectureHours ?? s.L ?? 3);
      const T = Number(s.tutorialHours ?? s.T ?? 0);
      const P = Number(s.practicalHours ?? s.P ?? 0);
      const calculatedCredits = !isNaN(credits) ? credits : L + Math.ceil(T / 2) + Math.ceil(P / 2);
      const internalMarks = Number(s.internalMarks ?? 40);
      const externalMarks = Number(s.externalMarks ?? 60);
      const maxMarks = Number(s.maxMarks ?? 100);
      const type = s.type ? s.type.toString().toUpperCase() : P > 0 ? "PRACTICAL" : "THEORY";

      if (!code || !name || isNaN(sem)) {
        errors.push(`Row ${i + 1}: Missing required fields (code, name, semester).`);
        continue;
      }

      try {
        const existing = await Subject.findOne({
          departmentId: deptId || undefined,
          semester: sem,
          code: code,
        });

        if (existing) {
          existing.name = name;
          existing.category = category as any;
          existing.lectureHours = L;
          existing.tutorialHours = T;
          existing.practicalHours = P;
          existing.credits = calculatedCredits;
          existing.internalMarks = internalMarks;
          existing.externalMarks = externalMarks;
          existing.maxMarks = maxMarks;
          existing.type = ["THEORY", "PRACTICAL", "PROJECT"].includes(type) ? (type as any) : P > 0 ? "PRACTICAL" : "THEORY";
          if (resolvedInstitutionId) existing.institutionId = resolvedInstitutionId;
          await existing.save();
          updatedCount++;
        } else {
          await Subject.create({
            institutionId: resolvedInstitutionId,
            departmentId: deptId || undefined,
            semester: sem,
            code: code,
            name: name,
            category: category as any,
            lectureHours: L,
            tutorialHours: T,
            practicalHours: P,
            credits: calculatedCredits,
            internalMarks: internalMarks,
            externalMarks: externalMarks,
            maxMarks: maxMarks,
            type: ["THEORY", "PRACTICAL", "PROJECT"].includes(type) ? (type as any) : P > 0 ? "PRACTICAL" : "THEORY",
          });
          insertedCount++;
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${code}): ${err?.message || "Failed to save"}`);
      }
    }

    return apiSuccess(
      {
        totalProcessed: subjects.length,
        insertedCount,
        updatedCount,
        errors,
      },
      undefined,
      200
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/subjects/bulk error:", error);
    return apiError("Failed to bulk process subjects", "INTERNAL_ERROR", 500);
  }
}
