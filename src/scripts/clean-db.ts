import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import { ensureSuperAdminSeeded } from "../services/super-admin-seed.service";

async function cleanAllData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
  }

  console.log("Connecting to:", uri.replace(/:([^:@]+)@/, ":****@"));
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const collections = await db.listCollections().toArray();
  console.log("Existing collections:", collections.map(c => c.name));

  const preserve = ["users", "super_admins"];

  for (const c of collections) {
    if (!preserve.includes(c.name)) {
      const res = await db.collection(c.name).deleteMany({});
      console.log(`Cleared ${c.name}: removed ${res.deletedCount} documents`);
    }
  }

  // Clear institutionId from all users so no phantom references exist
  await db.collection("users").updateMany({}, { $unset: { institutionId: "" } });
  console.log("Cleaned all institutionId references from users.");

  // Make sure 5 clean login users exist
  await ensureSuperAdminSeeded();

  console.log("\n--- COLLECTION AUDIT ---");
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`${c.name.padEnd(25)}: ${count}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

cleanAllData().catch((err) => {
  console.error(err);
  process.exit(1);
});
