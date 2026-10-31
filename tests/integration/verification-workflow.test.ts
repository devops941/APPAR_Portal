import { describe, it, expect, vi, beforeEach } from "vitest";
import { processVerificationDecision } from "@/services/verification.service";
import { VerificationRequest } from "@/models/VerificationRequest";
import { VerificationEvent } from "@/models/VerificationEvent";
import { AcademicRecord } from "@/models/AcademicRecord";
import { DocumentModel } from "@/models/Document";

describe("Integration: Verification Workflow & Segregation of Duties", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const MOCK_SUBMITTER_ID = "66a999888777666555444331";
  const MOCK_OFFICER_ID = "66a999888777666555444332";

  it("should throw a Conflict of Interest error when submitter attempts to verify their own record", async () => {
    const mockRequest = {
      _id: "vr_001",
      requestId: "REQ-2026-001",
      submittedBy: MOCK_SUBMITTER_ID,
      status: "SUBMITTED",
      targetType: "ACADEMIC_RECORD",
      targetId: "rec_101",
      decisionRemarks: "",
      save: vi.fn(),
    };

    vi.spyOn(VerificationRequest, "findOne").mockResolvedValue(mockRequest as never);

    await expect(
      processVerificationDecision({
        requestId: "REQ-2026-001",
        officerUserId: MOCK_SUBMITTER_ID, // Submitter is same as officer!
        decision: "VERIFIED",
        remarks: "Approved by submitter",
      })
    ).rejects.toThrowError(
      "Conflict of Interest: You cannot review a record you submitted yourself."
    );
  });

  it("should allow an independent verification officer to approve and lock the record", async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    const mockRequest = {
      _id: "vr_002",
      requestId: "REQ-2026-002",
      submittedBy: MOCK_SUBMITTER_ID,
      status: "SUBMITTED",
      targetType: "ACADEMIC_RECORD",
      targetId: "rec_102",
      decisionRemarks: "",
      save: saveMock,
    };

    vi.spyOn(VerificationRequest, "findOne").mockResolvedValue(mockRequest as never);
    vi.spyOn(AcademicRecord, "findByIdAndUpdate").mockResolvedValue({} as never);
    vi.spyOn(VerificationEvent, "create").mockResolvedValue({} as never);

    await processVerificationDecision({
      requestId: "REQ-2026-002",
      officerUserId: MOCK_OFFICER_ID, // Different user
      decision: "VERIFIED",
      remarks: "Marksheet verified against official controller transcripts",
    });

    expect(mockRequest.status).toBe("VERIFIED");
    expect(mockRequest.decisionRemarks).toBe("Marksheet verified against official controller transcripts");
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(AcademicRecord.findByIdAndUpdate).toHaveBeenCalledWith(
      "rec_102",
      expect.objectContaining({ status: "VERIFIED" })
    );
  });

  it("should reject re-verification once a request has already been locked as VERIFIED", async () => {
    const mockRequest = {
      _id: "vr_003",
      requestId: "REQ-2026-003",
      submittedBy: MOCK_SUBMITTER_ID,
      status: "VERIFIED", // Already verified
      targetType: "ACADEMIC_RECORD",
      targetId: "rec_103",
      decisionRemarks: "",
      save: vi.fn(),
    };

    vi.spyOn(VerificationRequest, "findOne").mockResolvedValue(mockRequest as never);

    await expect(
      processVerificationDecision({
        requestId: "REQ-2026-003",
        officerUserId: MOCK_OFFICER_ID,
        decision: "REJECTED",
        remarks: "Attempt to override locked record",
      })
    ).rejects.toThrowError(
      "This request has already been verified and is locked."
    );
  });
});
