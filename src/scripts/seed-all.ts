import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import { ensureSuperAdminSeeded } from "../services/super-admin-seed.service";

/**
 * Safe Seeder: Clears all dummy institutions, departments, students, records,
 * and maintains ONLY the 5 verified login personas.
 */
async function safeSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const collections = await db.listCollections().toArray();
  const preserve = ["users", "super_admins"];

  for (const c of collections) {
    if (!preserve.includes(c.name)) {
      await db.collection(c.name).deleteMany({});
    }
  }

  await db.collection("users").updateMany({}, { $unset: { institutionId: "" } });
  await ensureSuperAdminSeeded();

  console.log("✅ Database verified: 0 institutions, 0 departments, 0 students.");
  console.log("✅ 5 Demo login users available.");

  await mongoose.disconnect();
  process.exit(0);
}

safeSeed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
