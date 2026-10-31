import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import { Institution } from "../models/Institution";
import { Department, Course, Subject } from "../models/Catalog";
import { User } from "../models/User";
import { SuperAdmin } from "../models/SuperAdmin";
import { Student } from "../models/Student";
import { AcademicRecord } from "../models/AcademicRecord";
import { DocumentModel } from "../models/Document";
import { VerificationRequest } from "../models/VerificationRequest";
import { VerificationEvent } from "../models/VerificationEvent";
import { AuditLog } from "../models/AuditLog";
import { ensureSuperAdminSeeded } from "../services/super-admin-seed.service";

async function resetAndSeedUsersOnly() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local!");
    process.exit(1);
  }

  console.log("\n============================================================");
  console.log("🧹 PURGING ALL DATA & SEEDING 5 LOGIN USERS ONLY (0 INSTITUTIONS)");
  console.log("============================================================\n");

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB Atlas.");

  // 1. Wipe EVERYTHING from all collections
  console.log("\n🗑️  Deleting all records from all collections...");
  await Promise.all([
    Student.deleteMany({}),
    AcademicRecord.deleteMany({}),
    DocumentModel.deleteMany({}),
    VerificationRequest.deleteMany({}),
    VerificationEvent.deleteMany({}),
    AuditLog.deleteMany({}),
    Course.deleteMany({}),
    Subject.deleteMany({}),
    Department.deleteMany({}),
    Institution.deleteMany({}),
    User.deleteMany({}),
    SuperAdmin.deleteMany({}),
  ]);
  console.log("   ✅ Database completely wiped clean (0 institutions, 0 departments, 0 students).");

  // 2. Seed ONLY the 5 login users
  console.log("\n🌱 Seeding 5 Login Users Only...");
  await ensureSuperAdminSeeded();

  const totalUsers = await User.countDocuments();
  const totalInsts = await Institution.countDocuments();
  const totalDepts = await Department.countDocuments();
  const totalStudents = await Student.countDocuments();

  console.log("\n============================================================");
  console.log("📊 DATABASE AUDIT VERIFICATION");
  console.log("============================================================");
  console.log(`   * Total Users:        ${totalUsers} (5 Roles)`);
  console.log(`   * Total Institutions: ${totalInsts} (Zero - Cleared)`);
  console.log(`   * Total Departments:  ${totalDepts} (Zero - Cleared)`);
  console.log(`   * Total Students:     ${totalStudents} (Zero - Cleared)`);

  console.log("\n============================================================");
  console.log("🎉 5 USERS READY TO LOG IN");
  console.log("============================================================");
  console.log(`
  ┌──────────────────────┬───────────────────────────────┬────────────┐
  │ Role                 │ Email                         │ Password   │
  ├──────────────────────┼───────────────────────────────┼────────────┤
  │ Super Admin          │ admin@aicte.gov.in            │ Admin@123  │
  │ Super Admin (Alt)    │ admin@gmail.com               │ Admin@123  │
  │ College Admin        │ admin.chennai@edu.in          │ Demo@12345 │
  │ Faculty              │ faculty.cse@chennai.edu.in    │ Demo@12345 │
  │ Verification Officer │ officer1@aicte.gov.in         │ Demo@12345 │
  │ Student              │ arun.kumar@chennai.edu.in     │ Demo@12345 │
  └──────────────────────┴───────────────────────────────┴────────────┘
  `);

  await mongoose.disconnect();
  console.log("👋 Disconnected from MongoDB. Process completed.");
  process.exit(0);
}

resetAndSeedUsersOnly().catch((err) => {
  console.error("❌ Reset and seed failed:", err);
  process.exit(1);
});
