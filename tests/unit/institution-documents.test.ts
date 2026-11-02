import { describe, it, expect } from "vitest";
import {
  createInstitutionSchema,
  institutionDocumentSchema,
} from "@/validators/institution";

describe("Institution Statutory Documents Validation", () => {
  it("successfully validates a valid statutory document item", () => {
    const validDoc = {
      title: "AICTE Extension of Approval 2026-27",
      documentType: "AICTE_APPROVAL",
      originalFileName: "aicte_eoa_2026.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1048576,
      storageKey: "apaar-documents/uuid-sample-key",
      storageProvider: "cloudinary" as const,
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      url: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
    };

    const result = institutionDocumentSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });

  it("fails validation when documentType is invalid", () => {
    const invalidDoc = {
      title: "Invalid Doc",
      documentType: "NOT_AN_ACTUAL_TYPE",
      originalFileName: "file.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
      storageKey: "key-123",
      storageProvider: "cloudinary",
      sha256Hash: "hash123",
    };

    const result = institutionDocumentSchema.safeParse(invalidDoc);
    expect(result.success).toBe(false);
  });

  it("validates institution creation payload with multiple statutory documents", () => {
    const payload = {
      name: "Indian Institute of Science",
      code: "IIS-001",
      category: "ENGINEERING",
      approvalReference: "AICTE-2026-REG-01",
      address: {
        street: "CV Raman Road",
        city: "Bengaluru",
        district: "Bengaluru Urban",
        state: "Karnataka",
        pincode: "560012",
      },
      contactEmail: "registrar@iisc.ac.in",
      contactPhone: "+91 80 2293 2004",
      principalName: "Prof. Govindan Rangarajan",
      documents: [
        {
          title: "AICTE Approval Letter",
          documentType: "AICTE_APPROVAL",
          originalFileName: "aicte_letter.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 524288,
          storageKey: "key-aicte",
          storageProvider: "cloudinary" as const,
          sha256Hash: "hash-aicte",
          url: "https://res.cloudinary.com/sample/aicte.pdf",
        },
        {
          title: "UGC 2(f) Notification",
          documentType: "UGC_RECOGNITION",
          originalFileName: "ugc_notification.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 262144,
          storageKey: "key-ugc",
          storageProvider: "cloudinary" as const,
          sha256Hash: "hash-ugc",
        },
      ],
    };

    const result = createInstitutionSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.documents).toHaveLength(2);
      expect(result.data.documents?.[0].documentType).toBe("AICTE_APPROVAL");
      expect(result.data.documents?.[1].documentType).toBe("UGC_RECOGNITION");
    }
  });

  it("allows institution creation without documents (documents is optional)", () => {
    const payload = {
      name: "Government College of Technology",
      code: "GCT-002",
      category: "ENGINEERING",
      approvalReference: "AICTE-GCT-2026",
      address: {
        street: "Thadagam Road",
        city: "Coimbatore",
        district: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641013",
      },
      contactEmail: "principal@gct.ac.in",
      contactPhone: "+91 422 243 2221",
      principalName: "Dr. K. Manimekalai",
    };

    const result = createInstitutionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("verifies Institution model schema includes documents subdocument path", async () => {
    const { Institution } = await import("@/models/Institution");
    expect(Institution.schema.paths.documents).toBeDefined();
  });
});

