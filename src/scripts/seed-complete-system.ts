import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import { hashPassword } from "../lib/auth/password";

// Import Models
import { User } from "../models/User";
import { SuperAdmin } from "../models/SuperAdmin";
import { Institution } from "../models/Institution";
import { Department, Course, Subject } from "../models/Catalog";
import { Student } from "../models/Student";
import { AcademicRecord } from "../models/AcademicRecord";
import { DocumentModel } from "../models/Document";
import { VerificationRequest } from "../models/VerificationRequest";

const UPLOAD_DIR = path.resolve(process.cwd(), "./uploads");

async function seedCompleteSystem() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
  }

  console.log("=================================================");
  console.log("🚀 STARTING COMPLETE DATABASE RESET & SEEDING");
  console.log("=================================================");
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  // 1. Wipe all collections clean
  console.log("\n🗑️  Step 1: Clearing all collections...");
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.collection(c.name).deleteMany({});
    console.log(`   - Cleared collection: ${c.name}`);
  }

  // 2. Prepare Sample Physical Files in ./uploads
  console.log("\n📁 Step 2: Preparing sample physical documents in ./uploads...");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Read existing valid image from uploads or create sample buffer
  let samplePngBuffer: Buffer;
  let sampleJpegBuffer: Buffer;

  try {
    const existingPng = path.join(
      UPLOAD_DIR,
      "fdr-documents-bucket_8627af60-9645-4692-996e-17f390c8ba73.png"
    );
    samplePngBuffer = await fs.readFile(existingPng);
  } catch {
    // 1x1 transparent PNG fallback
    samplePngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
  }

  try {
    const existingJpeg = path.join(
      UPLOAD_DIR,
      "fdr-documents-bucket_1992837e-0108-4f5e-88e8-41e2e54ad09b.jpeg"
    );
    sampleJpegBuffer = await fs.readFile(existingJpeg);
  } catch {
    sampleJpegBuffer = samplePngBuffer;
  }

  async function createLocalDoc(fileName: string, isPng: boolean) {
    const filePath = path.join(UPLOAD_DIR, fileName);
    const buffer = isPng ? samplePngBuffer : sampleJpegBuffer;
    await fs.writeFile(filePath, buffer);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return {
      storageKey: fileName,
      fileSizeBytes: buffer.length,
      mimeType: isPng ? "image/png" : "image/jpeg",
      sha256Hash: hash,
      url: `/api/institutions/preview?key=${encodeURIComponent(
        fileName
      )}&provider=local&name=${encodeURIComponent(fileName)}`,
    };
  }

  const docNittAicte = await createLocalDoc("statutory-nitt-aicte-2026.png", true);
  const docNittUgc = await createLocalDoc("statutory-nitt-ugc-2026.jpeg", false);
  const docGctAicte = await createLocalDoc("statutory-gct-aicte-2026.png", true);
  const docGctAffil = await createLocalDoc("statutory-gct-affiliation-2026.jpeg", false);

  const docArunMarksheet = await createLocalDoc("student-arun-marksheet-s3.png", true);
  const docPriyaBonafide = await createLocalDoc("student-priya-bonafide.jpeg", false);
  const docKarthikMarksheet = await createLocalDoc("student-karthik-marksheet-s3.png", true);
  const docSnehaAdmission = await createLocalDoc("student-sneha-admission.jpeg", false);

  console.log("   ✅ 8 physical document assets generated with SHA-256 seals.");

  // Passwords
  const adminPassHash = await hashPassword("Admin@123");
  const demoPassHash = await hashPassword("Demo@12345");

  // 3. Seed Super Admin & Verification Officer
  console.log("\n👤 Step 3: Seeding Central Platform Officers...");
  const superAdmin = await SuperAdmin.create({
    name: "National AICTE Administrator",
    email: "admin@aicte.gov.in",
    passwordHash: adminPassHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  const superAdminUser = await User.create({
    name: "National AICTE Administrator",
    email: "admin@aicte.gov.in",
    passwordHash: adminPassHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  // Secondary admin alias
  await User.create({
    name: "Super Administrator (Alt)",
    email: "admin@gmail.com",
    passwordHash: adminPassHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  const verificationOfficer = await User.create({
    name: "S. Narayanan (Chief Scrutiny Officer)",
    email: "officer1@aicte.gov.in",
    passwordHash: demoPassHash,
    role: "VERIFICATION_OFFICER",
    isActive: true,
  });
  console.log("   ✅ Super Admin: admin@aicte.gov.in | admin@gmail.com (Admin@123)");
  console.log("   ✅ Verification Officer: officer1@aicte.gov.in (Demo@12345)");

  // 4. Seed Institution 1: NIT Trichy
  console.log("\n🏛️  Step 4: Seeding Institution 1 (NIT Trichy)...");
  const nittInst = await Institution.create({
    name: "National Institute of Technology, Tiruchirappalli",
    code: "NITT-001",
    category: "ENGINEERING",
    address: {
      street: "Tanjore Main Road, National Highway 67",
      city: "Tiruchirappalli",
      district: "Tiruchirappalli",
      state: "Tamil Nadu",
      pincode: "620015",
    },
    contactEmail: "principal@nitt.edu",
    contactPhone: "+91 94431 23456",
    principalName: "Dr. G. Aghila",
    approvalReference: "AICTE-TN-ENGG-2026-NITT",
    status: "SUBMITTED", // Ready for Scrutiny Desk!
    documents: [
      {
        title: "AICTE Statutory Extension of Approval 2026-27",
        documentType: "AICTE_APPROVAL",
        originalFileName: "AICTE_EOA_Approval_NITT.png",
        mimeType: docNittAicte.mimeType,
        fileSizeBytes: docNittAicte.fileSizeBytes,
        storageKey: docNittAicte.storageKey,
        storageProvider: "local",
        sha256Hash: docNittAicte.sha256Hash,
        url: docNittAicte.url,
        uploadedAt: new Date(),
      },
      {
        title: "UGC Section 2(f) & 12(B) Permanent Autonomous Order",
        documentType: "UGC_RECOGNITION",
        originalFileName: "UGC_Recognition_Order_NITT.jpeg",
        mimeType: docNittUgc.mimeType,
        fileSizeBytes: docNittUgc.fileSizeBytes,
        storageKey: docNittUgc.storageKey,
        storageProvider: "local",
        sha256Hash: docNittUgc.sha256Hash,
        url: docNittUgc.url,
        uploadedAt: new Date(),
      },
    ],
  });

  // NITT Admin & Faculty
  const nittAdmin = await User.create({
    name: "NITT Registrar & Campus Admin",
    email: "admin.nitt@nitt.edu",
    passwordHash: demoPassHash,
    role: "INSTITUTION_ADMIN",
    institutionId: nittInst._id,
    isActive: true,
  });

  // Legacy demo alias so existing bookmarks work
  await User.create({
    name: "NITT Admin (Demo Alias)",
    email: "admin.chennai@edu.in",
    passwordHash: demoPassHash,
    role: "INSTITUTION_ADMIN",
    institutionId: nittInst._id,
    isActive: true,
  });

  const nittFaculty = await User.create({
    name: "Prof. Rajesh Sharma (HOD CSE)",
    email: "faculty.cse@nitt.edu",
    passwordHash: demoPassHash,
    role: "FACULTY",
    institutionId: nittInst._id,
    isActive: true,
  });

  // NITT Department & Course & Subjects
  const nittDept = await Department.create({
    institutionId: nittInst._id,
    name: "Computer Science & Engineering",
    code: "CSE",
    hodName: "Prof. Rajesh Sharma",
  });

  const nittCourse = await Course.create({
    institutionId: nittInst._id,
    departmentId: nittDept._id,
    title: "Bachelor of Technology in Computer Science & Engineering",
    code: "BTECH-CSE",
    durationYears: 4,
    totalSemesters: 8,
  });

  const subDsa = await Subject.create({
    institutionId: nittInst._id,
    departmentId: nittDept._id,
    courseId: nittCourse._id,
    code: "CS201",
    name: "Data Structures & Algorithms",
    category: "PCC",
    semester: 3,
    credits: 4,
    maxMarks: 100,
    type: "THEORY",
  });

  const subOs = await Subject.create({
    institutionId: nittInst._id,
    departmentId: nittDept._id,
    courseId: nittCourse._id,
    code: "CS202",
    name: "Operating Systems & Concurrency",
    category: "PCC",
    semester: 3,
    credits: 4,
    maxMarks: 100,
    type: "THEORY",
  });

  const subDbms = await Subject.create({
    institutionId: nittInst._id,
    departmentId: nittDept._id,
    courseId: nittCourse._id,
    code: "CS203",
    name: "Database Management Systems",
    category: "PCC",
    semester: 3,
    credits: 4,
    maxMarks: 100,
    type: "THEORY",
  });

  // 2 Students for NITT
  // Student 1: Arun Kumar
  const userArun = await User.create({
    name: "Arun Kumar",
    email: "arun.kumar@nitt.edu",
    passwordHash: demoPassHash,
    role: "STUDENT",
    institutionId: nittInst._id,
    isActive: true,
  });
  // Legacy alias
  await User.create({
    name: "Arun Kumar (Legacy Alias)",
    email: "arun.kumar@chennai.edu.in",
    passwordHash: demoPassHash,
    role: "STUDENT",
    institutionId: nittInst._id,
    isActive: true,
  });

  const studentArun = await Student.create({
    userId: userArun._id,
    institutionId: nittInst._id,
    departmentId: nittDept._id,
    registerNumber: "106122001",
    apaarId: "202601001001",
    fullName: "Arun Kumar",
    dateOfBirth: new Date("2004-05-15"),
    gender: "MALE",
    admissionYear: 2022,
    currentSemester: 4,
    academicStatus: "ACTIVE",
  });

  const recordArun = await AcademicRecord.create({
    studentId: studentArun._id,
    institutionId: nittInst._id,
    academicYear: "2023-2024",
    semester: 3,
    subjects: [
      {
        subjectId: subDsa._id,
        subjectCode: "CS201",
        subjectName: "Data Structures & Algorithms",
        credits: 4,
        marksObtained: 88,
        maxMarks: 100,
        grade: "A+",
        gradePoint: 9,
        result: "PASS",
      },
      {
        subjectId: subOs._id,
        subjectCode: "CS202",
        subjectName: "Operating Systems & Concurrency",
        credits: 4,
        marksObtained: 85,
        maxMarks: 100,
        grade: "A",
        gradePoint: 8,
        result: "PASS",
      },
      {
        subjectId: subDbms._id,
        subjectCode: "CS203",
        subjectName: "Database Management Systems",
        credits: 4,
        marksObtained: 92,
        maxMarks: 100,
        grade: "O",
        gradePoint: 10,
        result: "PASS",
      },
    ],
    totalCredits: 12,
    sgpa: 9.0,
    status: "VERIFIED",
    version: 1,
    verifiedAt: new Date(),
  });

  await DocumentModel.create({
    studentId: studentArun._id,
    institutionId: nittInst._id,
    documentType: "SEMESTER_MARKSHEET",
    title: "Semester 3 Statutory Grade Marksheet",
    originalFileName: "Semester_3_Marksheet_Arun.png",
    mimeType: docArunMarksheet.mimeType,
    fileSizeBytes: docArunMarksheet.fileSizeBytes,
    storageKey: docArunMarksheet.storageKey,
    storageProvider: "local",
    sha256Hash: docArunMarksheet.sha256Hash,
    status: "VERIFIED",
    version: 1,
    relatedAcademicRecordId: recordArun._id,
    uploadedBy: nittFaculty._id,
    verifiedBy: verificationOfficer._id,
  });

  // Student 2: Priya Sundaram
  const userPriya = await User.create({
    name: "Priya Sundaram",
    email: "priya.s@nitt.edu",
    passwordHash: demoPassHash,
    role: "STUDENT",
    institutionId: nittInst._id,
    isActive: true,
  });

  const studentPriya = await Student.create({
    userId: userPriya._id,
    institutionId: nittInst._id,
    departmentId: nittDept._id,
    registerNumber: "106122002",
    apaarId: "202601001002",
    fullName: "Priya Sundaram",
    dateOfBirth: new Date("2004-09-20"),
    gender: "FEMALE",
    admissionYear: 2022,
    currentSemester: 4,
    academicStatus: "ACTIVE",
  });

  const recordPriya = await AcademicRecord.create({
    studentId: studentPriya._id,
    institutionId: nittInst._id,
    academicYear: "2023-2024",
    semester: 3,
    subjects: [
      {
        subjectId: subDsa._id,
        subjectCode: "CS201",
        subjectName: "Data Structures & Algorithms",
        credits: 4,
        marksObtained: 94,
        maxMarks: 100,
        grade: "O",
        gradePoint: 10,
        result: "PASS",
      },
      {
        subjectId: subOs._id,
        subjectCode: "CS202",
        subjectName: "Operating Systems & Concurrency",
        credits: 4,
        marksObtained: 91,
        maxMarks: 100,
        grade: "O",
        gradePoint: 10,
        result: "PASS",
      },
    ],
    totalCredits: 8,
    sgpa: 10.0,
    status: "VERIFIED",
    version: 1,
    verifiedAt: new Date(),
  });

  await DocumentModel.create({
    studentId: studentPriya._id,
    institutionId: nittInst._id,
    documentType: "BONAFIDE",
    title: "Institutional Bonafide Certificate",
    originalFileName: "Bonafide_Priya_Sundaram.jpeg",
    mimeType: docPriyaBonafide.mimeType,
    fileSizeBytes: docPriyaBonafide.fileSizeBytes,
    storageKey: docPriyaBonafide.storageKey,
    storageProvider: "local",
    sha256Hash: docPriyaBonafide.sha256Hash,
    status: "VERIFIED",
    version: 1,
    uploadedBy: nittAdmin._id,
  });

  console.log("   ✅ NITT seeded with 2 Attached Statutory Documents.");
  console.log("   ✅ NITT CSE Department & 3 Subjects seeded.");
  console.log("   ✅ 2 Students (Arun Kumar & Priya Sundaram) with verified records & documents.");

  // 5. Seed Institution 2: GCT Coimbatore
  console.log("\n🏛️  Step 5: Seeding Institution 2 (GCT Coimbatore)...");
  const gctInst = await Institution.create({
    name: "Government College of Technology, Coimbatore",
    code: "GCT-002",
    category: "ENGINEERING",
    address: {
      street: "Thadagam Road",
      city: "Coimbatore",
      district: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641013",
    },
    contactEmail: "principal@gct.ac.in",
    contactPhone: "+91 98421 23456",
    principalName: "Dr. K. Manimekalai",
    approvalReference: "AICTE-TN-ENGG-2026-GCT",
    status: "UNDER_REVIEW", // Actively under review in Verification Desk!
    documents: [
      {
        title: "AICTE Statutory Affiliation & Approval Order",
        documentType: "AICTE_APPROVAL",
        originalFileName: "AICTE_Approval_Order_GCT.png",
        mimeType: docGctAicte.mimeType,
        fileSizeBytes: docGctAicte.fileSizeBytes,
        storageKey: docGctAicte.storageKey,
        storageProvider: "local",
        sha256Hash: docGctAicte.sha256Hash,
        url: docGctAicte.url,
        uploadedAt: new Date(),
      },
      {
        title: "Anna University Statutory Affiliation Certificate",
        documentType: "AFFILIATION_CERTIFICATE",
        originalFileName: "Anna_University_Affiliation_GCT.jpeg",
        mimeType: docGctAffil.mimeType,
        fileSizeBytes: docGctAffil.fileSizeBytes,
        storageKey: docGctAffil.storageKey,
        storageProvider: "local",
        sha256Hash: docGctAffil.sha256Hash,
        url: docGctAffil.url,
        uploadedAt: new Date(),
      },
    ],
  });

  const gctAdmin = await User.create({
    name: "GCT Academic Dean & Registrar",
    email: "admin.gct@gct.ac.in",
    passwordHash: demoPassHash,
    role: "INSTITUTION_ADMIN",
    institutionId: gctInst._id,
    isActive: true,
  });

  const gctFaculty = await User.create({
    name: "Dr. M. Senthil (HOD IT)",
    email: "faculty.it@gct.ac.in",
    passwordHash: demoPassHash,
    role: "FACULTY",
    institutionId: gctInst._id,
    isActive: true,
  });

  const gctDept = await Department.create({
    institutionId: gctInst._id,
    name: "Information Technology",
    code: "IT",
    hodName: "Dr. M. Senthil",
  });

  const gctCourse = await Course.create({
    institutionId: gctInst._id,
    departmentId: gctDept._id,
    title: "Bachelor of Technology in Information Technology",
    code: "BTECH-IT",
    durationYears: 4,
    totalSemesters: 8,
  });

  const subNetworks = await Subject.create({
    institutionId: gctInst._id,
    departmentId: gctDept._id,
    courseId: gctCourse._id,
    code: "IT201",
    name: "Computer Networks & Security Protocols",
    category: "PCC",
    semester: 3,
    credits: 4,
    maxMarks: 100,
    type: "THEORY",
  });

  const subCloud = await Subject.create({
    institutionId: gctInst._id,
    departmentId: gctDept._id,
    courseId: gctCourse._id,
    code: "IT202",
    name: "Cloud Computing & Distributed Systems",
    category: "PEC",
    semester: 3,
    credits: 3,
    maxMarks: 100,
    type: "THEORY",
  });

  // 2 Students for GCT
  // Student 3: Karthik Raja
  const userKarthik = await User.create({
    name: "Karthik Raja",
    email: "karthik.raja@gct.ac.in",
    passwordHash: demoPassHash,
    role: "STUDENT",
    institutionId: gctInst._id,
    isActive: true,
  });

  const studentKarthik = await Student.create({
    userId: userKarthik._id,
    institutionId: gctInst._id,
    departmentId: gctDept._id,
    registerNumber: "2022IT101",
    apaarId: "202602002001",
    fullName: "Karthik Raja",
    dateOfBirth: new Date("2004-03-10"),
    gender: "MALE",
    admissionYear: 2022,
    currentSemester: 4,
    academicStatus: "ACTIVE",
  });

  const recordKarthik = await AcademicRecord.create({
    studentId: studentKarthik._id,
    institutionId: gctInst._id,
    academicYear: "2023-2024",
    semester: 3,
    subjects: [
      {
        subjectId: subNetworks._id,
        subjectCode: "IT201",
        subjectName: "Computer Networks & Security Protocols",
        credits: 4,
        marksObtained: 86,
        maxMarks: 100,
        grade: "A",
        gradePoint: 8,
        result: "PASS",
      },
      {
        subjectId: subCloud._id,
        subjectCode: "IT202",
        subjectName: "Cloud Computing & Distributed Systems",
        credits: 3,
        marksObtained: 89,
        maxMarks: 100,
        grade: "A+",
        gradePoint: 9,
        result: "PASS",
      },
    ],
    totalCredits: 7,
    sgpa: 8.43,
    status: "VERIFIED",
    version: 1,
    verifiedAt: new Date(),
  });

  await DocumentModel.create({
    studentId: studentKarthik._id,
    institutionId: gctInst._id,
    documentType: "SEMESTER_MARKSHEET",
    title: "Semester 3 Marksheet",
    originalFileName: "Semester_3_Marksheet_Karthik.png",
    mimeType: docKarthikMarksheet.mimeType,
    fileSizeBytes: docKarthikMarksheet.fileSizeBytes,
    storageKey: docKarthikMarksheet.storageKey,
    storageProvider: "local",
    sha256Hash: docKarthikMarksheet.sha256Hash,
    status: "VERIFIED",
    version: 1,
    relatedAcademicRecordId: recordKarthik._id,
    uploadedBy: gctFaculty._id,
    verifiedBy: verificationOfficer._id,
  });

  // Student 4: Sneha Ramachandran
  const userSneha = await User.create({
    name: "Sneha Ramachandran",
    email: "sneha.r@gct.ac.in",
    passwordHash: demoPassHash,
    role: "STUDENT",
    institutionId: gctInst._id,
    isActive: true,
  });

  const studentSneha = await Student.create({
    userId: userSneha._id,
    institutionId: gctInst._id,
    departmentId: gctDept._id,
    registerNumber: "2022IT102",
    apaarId: "202602002002",
    fullName: "Sneha Ramachandran",
    dateOfBirth: new Date("2004-11-28"),
    gender: "FEMALE",
    admissionYear: 2022,
    currentSemester: 4,
    academicStatus: "ACTIVE",
  });

  const recordSneha = await AcademicRecord.create({
    studentId: studentSneha._id,
    institutionId: gctInst._id,
    academicYear: "2023-2024",
    semester: 3,
    subjects: [
      {
        subjectId: subNetworks._id,
        subjectCode: "IT201",
        subjectName: "Computer Networks & Security Protocols",
        credits: 4,
        marksObtained: 93,
        maxMarks: 100,
        grade: "O",
        gradePoint: 10,
        result: "PASS",
      },
    ],
    totalCredits: 4,
    sgpa: 10.0,
    status: "SUBMITTED",
    version: 1,
    submittedBy: gctFaculty._id,
    submittedAt: new Date(),
  });

  await DocumentModel.create({
    studentId: studentSneha._id,
    institutionId: gctInst._id,
    documentType: "ADMISSION_PROOF",
    title: "Official Statutory Admission Proof",
    originalFileName: "Admission_Order_Sneha.jpeg",
    mimeType: docSnehaAdmission.mimeType,
    fileSizeBytes: docSnehaAdmission.fileSizeBytes,
    storageKey: docSnehaAdmission.storageKey,
    storageProvider: "local",
    sha256Hash: docSnehaAdmission.sha256Hash,
    status: "PENDING",
    version: 1,
    uploadedBy: gctAdmin._id,
  });

  // Create active Verification Requests for Scrutiny Desk
  await VerificationRequest.create({
    requestId: "VR-2026-0001",
    studentId: studentSneha._id,
    institutionId: gctInst._id,
    targetType: "ACADEMIC_RECORD",
    targetId: recordSneha._id,
    submittedBy: gctFaculty._id,
    status: "PENDING",
  });

  console.log("   ✅ GCT seeded with 2 Attached Statutory Documents.");
  console.log("   ✅ GCT IT Department & Subjects seeded.");
  console.log("   ✅ 2 Students (Karthik Raja & Sneha Ramachandran) with records & documents.");

  console.log("\n=================================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
  console.log("📊 Summary of seeded records:");
  console.log(`   - Institutions: 2 (Both have 2 Attached Statutory Documents)`);
  console.log(`   - Departments:  2 (CSE, IT)`);
  console.log(`   - Courses:      2 (B.Tech CSE, B.Tech IT)`);
  console.log(`   - Subjects:     5 total`);
  console.log(`   - Students:     4 total (2 per institution)`);
  console.log(`   - Documents:    8 physical documents attached & sealed in uploads/`);
  console.log("=================================================");

  await mongoose.disconnect();
  process.exit(0);
}

seedCompleteSystem().catch((err) => {
  console.error("❌ Fatal seeding error:", err);
  process.exit(1);
});
