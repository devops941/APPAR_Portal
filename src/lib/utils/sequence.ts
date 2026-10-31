import mongoose from "mongoose";
import { Student } from "@/models/Student";
import { Department, Subject } from "@/models/Catalog";
import { Institution } from "@/models/Institution";

/**
 * Generate the next sequential student register / roll number.
 * Standard University Pattern: [YearShort][DeptCode][3-digit Seq]
 * Example: 2024 + CSE -> 24CSE001, 24CSE002, 24CSE003...
 */
export async function getNextStudentRollNumber(params: {
  institutionId: string | mongoose.Types.ObjectId;
  departmentId: string | mongoose.Types.ObjectId;
  admissionYear: number;
}): Promise<string> {
  const { institutionId, departmentId, admissionYear } = params;

  // 1. Fetch department code
  const dept = await Department.findById(departmentId).select("code").lean();
  const deptCode = dept?.code ? dept.code.toUpperCase().replace(/[^A-Z0-9]/g, "") : "GEN";

  // 2. Extract 2-digit year (e.g. 2024 -> "24")
  const yearShort = String(admissionYear).slice(-2);
  const prefix = `${yearShort}${deptCode}`;

  // 3. Find all existing register numbers matching this prefix within the institution
  const existingStudents = await Student.find({
    institutionId,
    registerNumber: { $regex: new RegExp(`^${prefix}\\d+$`, "i") },
  })
    .select("registerNumber")
    .lean();

  let maxSeq = 0;
  for (const s of existingStudents) {
    if (!s.registerNumber) continue;
    // Extract numerical sequence after prefix
    const suffix = s.registerNumber.slice(prefix.length);
    const seqNum = parseInt(suffix, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  }

  const nextSeq = maxSeq + 1;
  // Pad with leading zeros (e.g. 1 -> 001, 12 -> 012)
  const paddedSeq = String(nextSeq).padStart(3, "0");

  return `${prefix}${paddedSeq}`;
}

/**
 * Generate the next sequential Institution Code.
 * Example: INST-001, INST-002, or based on college acronym e.g. CIT-001
 */
export async function getNextInstitutionCode(suggestedName?: string): Promise<string> {
  let prefix = "INST";

  if (suggestedName && suggestedName.trim().length > 0) {
    const words = suggestedName
      .trim()
      .split(/\s+/)
      .filter((w) => !["OF", "AND", "&", "FOR", "THE", "IN", "AT"].includes(w.toUpperCase()));
    if (words.length > 1) {
      const acronym = words
        .map((w) => w.charAt(0).toUpperCase())
        .filter((c) => /[A-Z]/.test(c))
        .join("");
      if (acronym.length >= 2 && acronym.length <= 5) {
        prefix = acronym;
      }
    } else if (suggestedName.length <= 4) {
      prefix = suggestedName.toUpperCase();
    }
  }

  // Find institutions with matching prefix-number pattern
  const existingInsts = await Institution.find({
    code: { $regex: new RegExp(`^${prefix}-\\d+$`, "i") },
  })
    .select("code")
    .lean();

  let maxSeq = 0;
  for (const inst of existingInsts) {
    if (!inst.code) continue;
    const parts = inst.code.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  // Fallback: If no acronym matches, check global INST-XXX counter
  if (maxSeq === 0 && prefix !== "INST") {
    const codeExists = await Institution.findOne({ code: `${prefix}-001` }).lean();
    if (!codeExists) {
      return `${prefix}-001`;
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}-${String(nextSeq).padStart(3, "0")}`;
}

/**
 * Generate a smart Department Code based on department name.
 * Example: "Computer Science" -> "CSE", "Information Technology" -> "IT", "Mechanical" -> "MECH"
 * If name is omitted or empty, sequentially generates DEPT-01, DEPT-02...
 */
export async function getNextDepartmentCode(params: {
  institutionId: string | mongoose.Types.ObjectId;
  name?: string;
}): Promise<string> {
  const { institutionId, name } = params;
  const cleanName = (name || "").trim().toUpperCase();

  // If no name is provided, generate sequential code like DEPT-01, DEPT-02...
  if (!cleanName) {
    const existingDepts = await Department.find({ institutionId }).select("code").lean();
    let maxSeq = 0;
    for (const d of existingDepts) {
      if (!d.code) continue;
      const match = d.code.match(/^DEPT-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
    const nextSeq = maxSeq > 0 ? maxSeq + 1 : Math.max(1, existingDepts.length + 1);
    return `DEPT-${String(nextSeq).padStart(2, "0")}`;
  }

  // Common dictionary mappings
  const commonMap: Record<string, string> = {
    // Engineering & Technology
    "COMPUTER SCIENCE": "CSE",
    "COMPUTER SCIENCE & ENGINEERING": "CSE",
    "COMPUTER SCIENCE AND ENGINEERING": "CSE",
    "COMPUTER SCIENCE AND BUSINESS SYSTEMS": "CSBS",
    "COMPUTER SCIENCE & BUSINESS SYSTEMS": "CSBS",
    "INFORMATION TECHNOLOGY": "IT",
    "ELECTRONICS & COMMUNICATION": "ECE",
    "ELECTRONICS AND COMMUNICATION": "ECE",
    "ELECTRONICS & COMMUNICATION ENGINEERING": "ECE",
    "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
    "ELECTRICAL & ELECTRONICS": "EEE",
    "ELECTRICAL AND ELECTRONICS": "EEE",
    "ELECTRICAL & ELECTRONICS ENGINEERING": "EEE",
    "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
    "MECHANICAL": "MECH",
    "MECHANICAL ENGINEERING": "MECH",
    "CIVIL": "CIVIL",
    "CIVIL ENGINEERING": "CIVIL",
    "ARTIFICIAL INTELLIGENCE": "AI",
    "ARTIFICIAL INTELLIGENCE & DATA SCIENCE": "AIDS",
    "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE": "AIDS",
    "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "AIML",
    "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AIML",
    "DATA SCIENCE": "DS",
    "CYBER SECURITY": "CYBER",
    "CYBERSECURITY": "CYBER",
    "BIOMEDICAL": "BME",
    "BIOMEDICAL ENGINEERING": "BME",
    "BIOTECHNOLOGY": "BIOTECH",
    "CHEMICAL ENGINEERING": "CHEM",
    "AERONAUTICAL ENGINEERING": "AERO",
    "AEROSPACE ENGINEERING": "AERO",
    "AUTOMOBILE ENGINEERING": "AUTO",
    "MECHATRONICS": "MTRX",
    "MECHATRONICS ENGINEERING": "MTRX",

    // Science & Arts
    "TAMIL": "TAM",
    "ENGLISH": "ENG",
    "MATHEMATICS": "MATH",
    "MATHS": "MATH",
    "PHYSICS": "PHY",
    "CHEMISTRY": "CHEM",
    "BOTANY": "BOT",
    "ZOOLOGY": "ZOO",
    "COMMERCE": "COM",
    "ECONOMICS": "ECO",
    "HISTORY": "HIST",
    "GEOGRAPHY": "GEO",
    "PSYCHOLOGY": "PSY",
    "SOCIOLOGY": "SOC",
    "POLITICAL SCIENCE": "POL",

    // Management & Applications
    "BUSINESS ADMINISTRATION": "BBA",
    "MANAGEMENT STUDIES": "MBA",
    "COMPUTER APPLICATIONS": "BCA",
    "MASTER OF COMPUTER APPLICATIONS": "MCA",
  };

  let baseCode = commonMap[cleanName];

  if (!baseCode) {
    if (/^[A-Z0-9]{2,6}$/.test(cleanName)) {
      baseCode = cleanName;
    } else {
      const words = cleanName
        .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ")
        .split(/\s+/)
        .filter((w) => !["AND", "OF", "THE", "IN", "FOR", "TO", "DEPARTMENT", "DEPT"].includes(w));
      if (words.length > 1) {
        baseCode = words.map((w) => w.charAt(0)).join("");
      } else if (cleanName.length <= 5) {
        baseCode = cleanName;
      } else {
        baseCode = cleanName.slice(0, 4);
      }
    }
  }

  baseCode = baseCode.replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (!baseCode) baseCode = "DEPT";

  // Check if baseCode already exists in this institution
  const existing = await Department.findOne({
    institutionId,
    code: baseCode,
  }).lean();

  if (!existing) {
    return baseCode;
  }

  // Find next suffix (e.g. CSE-01, CSE-02)
  const similar = await Department.find({
    institutionId,
    code: { $regex: new RegExp(`^${baseCode}-\\d+$`, "i") },
  })
    .select("code")
    .lean();

  let maxNum = 0;
  for (const d of similar) {
    const parts = d.code.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  return `${baseCode}-${String(maxNum + 1).padStart(2, "0")}`;
}

/**
 * Generate the next unique AICTE Subject Code.
 * Standard University Pattern:
 * - Computer Science: CS101, CS102, CS301...
 * - Information Technology: IT101, IT102...
 * - Basic Science (Maths/Physics/Chemistry): MA101, PH101, CY101, BS101
 * - Electronics: EC101, EC301...
 * - Mechanical: ME101...
 */
export async function getNextSubjectCode(params: {
  departmentId?: string | mongoose.Types.ObjectId;
  semester?: number;
  category?: string;
  suggestedName?: string;
}): Promise<string> {
  const { departmentId, semester = 1, category, suggestedName } = params;

  let prefix = "CS";
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    const dept = await Department.findById(departmentId).select("code name").lean();
    if (dept?.code) {
      prefix = dept.code.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
      if (prefix === "CSE") prefix = "CS";
    }
  }

  // Refine prefix based on category or course title
  if (category === "BSC") {
    if (suggestedName && /math|calculus|algebra|statistic/i.test(suggestedName)) prefix = "MA";
    else if (suggestedName && /physic|optics/i.test(suggestedName)) prefix = "PH";
    else if (suggestedName && /chem/i.test(suggestedName)) prefix = "CY";
    else prefix = "BS";
  } else if (category === "HSMC") {
    prefix = "HS";
  } else if (category === "ESC" && suggestedName && /python|comput|programm/i.test(suggestedName)) {
    prefix = "GE";
  }

  const semNum = Math.max(1, Number(semester) || 1);

  // Search existing subjects in MongoDB with this prefix & semester
  const query: Record<string, unknown> = {
    code: { $regex: new RegExp(`^${prefix}`, "i") },
  };
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    query.departmentId = departmentId;
  }

  const existing = await Subject.find(query).select("code").lean();

  let maxSeq = 0;
  for (const s of existing) {
    if (!s.code) continue;
    // Standard pattern: e.g. CS101, CS102 (Prefix + Semester + 2 digits)
    const match = s.code.match(new RegExp(`^${prefix}${semNum}(\\d{2})$`, "i"));
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      continue;
    }

    // 4-digit regulation pattern: e.g. CS3101, MA3151
    const match4 = s.code.match(new RegExp(`^${prefix}\\d{1}${semNum}(\\d{2})$`, "i"));
    if (match4) {
      const seq = parseInt(match4[1], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  let nextSeq = maxSeq + 1;

  // Detect whether existing department curriculum prefers 4-digit regulation codes (e.g. CS3101, MA3151)
  const has4Digit = existing.some(
    (s) => s.code && new RegExp(`^${prefix}\\d{1}${semNum}\\d{2}$`, "i").test(s.code)
  );

  let candidate = has4Digit
    ? `${prefix}3${semNum}${String(nextSeq).padStart(2, "0")}`
    : `${prefix}${semNum}${String(nextSeq).padStart(2, "0")}`;

  // Guaranteed absolute collision-free uniqueness across database
  while (await Subject.exists({ code: candidate })) {
    nextSeq++;
    candidate = has4Digit
      ? `${prefix}3${semNum}${String(nextSeq).padStart(2, "0")}`
      : `${prefix}${semNum}${String(nextSeq).padStart(2, "0")}`;
  }

  return candidate;
}
