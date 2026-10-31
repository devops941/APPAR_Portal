import { z } from "zod";

export const createDepartmentSchema = z.object({
  institutionId: z.string().min(1, "Institution is required"),
  name: z.string().trim().min(3, "Department name must be at least 3 characters").max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Department code must be at least 2 characters")
    .max(12, "Department code cannot exceed 12 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens or underscores"),
  hodName: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(3, "Department name must be at least 3 characters").max(100).optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Department code must be at least 2 characters")
    .max(12, "Department code cannot exceed 12 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens or underscores")
    .optional(),
  hodName: z.string().trim().max(100).optional().or(z.literal("")),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
