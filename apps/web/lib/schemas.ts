import { z } from "zod";

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format");
const dateSchema = z.number().int().min(1).max(31, "Date must be between 1 and 31");
const positiveNumberSchema = z.number().positive("Value must be positive");
const nonNegativeNumberSchema = z.number().nonnegative("Value must be non-negative");

export const createMemberSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["regular", "eggOnly", "guest"]),
  isActive: z.boolean().default(true),
});

export const createMealSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
  count: z.number().int().min(1).max(2, "Count must be 1 or 2").default(2),
});

export const createEggEntryRequestSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
  pieces: z.number().int().positive("Pieces must be a positive integer"),
});

export const deleteEggEntryRequestSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
});

export const createGuestMealRequestSchema = z.object({
  month: monthSchema,
  date: dateSchema,
  meals: z.number().int().min(1).max(3, "Meals must be 1, 2, or 3"),
});

export const deleteGuestMealRequestSchema = z.object({
  month: monthSchema,
  date: dateSchema,
});

export const createBazarEntrySchema = z.object({
  month: monthSchema,
  date: dateSchema,
  day: z.string().min(1, "Day is required"),
  description: z.string().min(1, "Description is required"),
  amount: positiveNumberSchema,
  createdBy: z.string().min(1, "Created by is required"),
});

export const createAdvanceSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
  amount: positiveNumberSchema,
  receivedBy: z.string().min(1, "Received by is required"),
});

export const createEggEntrySchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
  pieces: z.number().int().positive("Pieces must be a positive integer"),
  pricePerPiece: z.number().positive().default(13),
});

export const createGuestMealSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  month: monthSchema,
  date: dateSchema,
  meals: z.number().int().min(1).max(3, "Meals must be 1, 2, or 3"),
  ratePerMeal: z.number().positive().default(70),
});

export const createMealOffRequestSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
  status: z.enum(["pending", "done"]).default("pending"),
});

export const createMonthSchema = z.object({
  month: monthSchema,
  managerId: z.string().min(1, "Manager ID is required"),
  isLocked: z.boolean().default(false),
  closedAt: z.date().optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type CreateBazarEntryInput = z.infer<typeof createBazarEntrySchema>;
export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>;
export type CreateEggEntryInput = z.infer<typeof createEggEntrySchema>;
export type CreateGuestMealInput = z.infer<typeof createGuestMealSchema>;
export type CreateMealOffRequestInput = z.infer<typeof createMealOffRequestSchema>;
export type CreateMonthInput = z.infer<typeof createMonthSchema>;