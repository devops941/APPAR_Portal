import { SuperAdmin } from "@/models/SuperAdmin";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";

let isSeeding = false;

/**
 * Automatically initializes ONLY the 5 demo login users without creating any institutions or dummy data.
 *
 * 5 Login Personas:
 * 1. Super Admin: admin@aicte.gov.in / admin@gmail.com (Password: Admin@123)
 * 2. College Admin: admin.chennai@edu.in (Password: Demo@12345)
 * 3. Faculty: faculty.cse@chennai.edu.in (Password: Demo@12345)
 * 4. Verification Officer: officer1@aicte.gov.in (Password: Demo@12345)
 * 5. Student: arun.kumar@chennai.edu.in (Password: Demo@12345)
 */
export async function ensureSuperAdminSeeded(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;

  try {
    const adminEmails = ["admin@aicte.gov.in", "admin@gmail.com"];
    const adminPass = "Admin@123";
    const demoPass = "Demo@12345";

    const adminHash = await hashPassword(adminPass);
    const demoHash = await hashPassword(demoPass);

    // 1. Super Admin in super_admins and users table
    for (const email of adminEmails) {
      let superAdmin = await SuperAdmin.findOne({ email });
      if (!superAdmin) {
        superAdmin = await SuperAdmin.create({
          name: "Super Administrator",
          email,
          passwordHash: adminHash,
          role: "SUPER_ADMIN",
          isActive: true,
        });
        console.log(`⚡ [Auto-Init] Super Admin created: ${email}`);
      } else {
        superAdmin.passwordHash = adminHash;
        superAdmin.isActive = true;
        await superAdmin.save();
      }

      let userAdmin = await User.findOne({ email });
      if (!userAdmin) {
        await User.create({
          name: "Super Administrator",
          email,
          passwordHash: adminHash,
          role: "SUPER_ADMIN",
          isActive: true,
        });
      } else {
        userAdmin.passwordHash = adminHash;
        userAdmin.isActive = true;
        await userAdmin.save();
      }
    }

    // 2. Seed other 4 personas in User collection (NO institutions, NO departments)
    const personasToSeed = [
      {
        email: "admin.chennai@edu.in",
        name: "College Administrator",
        role: "INSTITUTION_ADMIN" as const,
        hash: demoHash,
      },
      {
        email: "faculty.cse@chennai.edu.in",
        name: "Prof. Rajesh Sharma",
        role: "FACULTY" as const,
        hash: demoHash,
      },
      {
        email: "officer1@aicte.gov.in",
        name: "S. Narayanan (Attestation Officer)",
        role: "VERIFICATION_OFFICER" as const,
        hash: demoHash,
      },
      {
        email: "arun.kumar@chennai.edu.in",
        name: "Arun Kumar",
        role: "STUDENT" as const,
        hash: demoHash,
      },
    ];

    for (const p of personasToSeed) {
      let existing = await User.findOne({ email: p.email });
      if (!existing) {
        await User.create({
          name: p.name,
          email: p.email,
          passwordHash: p.hash,
          role: p.role,
          isActive: true,
        });
        console.log(`⚡ [Auto-Init] Seeded Demo User: ${p.email} (${p.role})`);
      } else {
        existing.passwordHash = p.hash;
        existing.isActive = true;
        existing.role = p.role;
        await existing.save();
      }
    }
  } catch (error) {
    console.error("❌ [Auto-Init] Failed to initialize demo personas:", error);
  } finally {
    isSeeding = false;
  }
}
