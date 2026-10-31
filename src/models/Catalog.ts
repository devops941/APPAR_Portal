import mongoose, { Schema, type Document, type Model } from "mongoose";
import "@/models/Institution";

/* ── Department ── */
export interface IDepartment extends Document {
  institutionId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  hodName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    hodName: { type: String, trim: true },
  },
  { timestamps: true }
);
DepartmentSchema.index({ institutionId: 1, code: 1 }, { unique: true });

/* ── Course / Program ── */
export interface ICourse extends Document {
  institutionId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  title: string;
  code: string;
  durationYears: number;
  totalSemesters: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    durationYears: { type: Number, default: 4 },
    totalSemesters: { type: Number, default: 8 },
  },
  { timestamps: true }
);
CourseSchema.index({ institutionId: 1, code: 1 }, { unique: true });

/* ── AICTE Model Curriculum Subject ── */
export type AicteCategory =
  | "BSC"
  | "ESC"
  | "PCC"
  | "PEC"
  | "OEC"
  | "HSMC"
  | "MC"
  | "PROJ";

export const AICTE_CATEGORIES: AicteCategory[] = [
  "BSC",
  "ESC",
  "PCC",
  "PEC",
  "OEC",
  "HSMC",
  "MC",
  "PROJ",
];

export interface ISubject extends Document {
  institutionId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  academicYear?: string;
  regulationYear?: string;
  semester: number;
  code: string;
  name: string;
  category?: AicteCategory;
  lectureHours?: number;   // L
  tutorialHours?: number;  // T
  practicalHours?: number; // P
  credits: number;         // C
  internalMarks?: number;  // CA / CIA (e.g. 40)
  externalMarks?: number;  // ESE (e.g. 60)
  maxMarks?: number;       // Total (100)
  type?: "THEORY" | "PRACTICAL" | "PROJECT";
  syllabusOutline?: string;
  isElective?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    academicYear: { type: String, default: "2025-2026", trim: true },
    regulationYear: { type: String, default: "AICTE-2024", trim: true },
    semester: { type: Number, required: true, min: 1, max: 16 },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: AICTE_CATEGORIES,
      default: "PCC",
      index: true,
    },
    lectureHours: { type: Number, default: 3, min: 0, max: 10 },
    tutorialHours: { type: Number, default: 0, min: 0, max: 5 },
    practicalHours: { type: Number, default: 0, min: 0, max: 10 },
    credits: { type: Number, required: true, min: 0, max: 20 },
    internalMarks: { type: Number, default: 40, min: 0, max: 100 },
    externalMarks: { type: Number, default: 60, min: 0, max: 100 },
    maxMarks: { type: Number, default: 100 },
    type: { type: String, enum: ["THEORY", "PRACTICAL", "PROJECT"], default: "THEORY" },
    syllabusOutline: { type: String, trim: true },
    isElective: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubjectSchema.index({ departmentId: 1, semester: 1, code: 1 }, { unique: true, sparse: true });
SubjectSchema.index({ courseId: 1, semester: 1, code: 1 }, { unique: true, sparse: true });
SubjectSchema.index({ departmentId: 1, category: 1 });

export const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

if (process.env.NODE_ENV !== "production" && mongoose.models.Subject) {
  delete (mongoose.models as any).Subject;
}

export const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);
