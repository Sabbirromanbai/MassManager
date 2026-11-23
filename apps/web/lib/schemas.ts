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
  count: z.number().int().min(0).max(3, "Count must be 0, 1, 2, or 3").default(2),
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
  description: z.string().min(1, "Description is required"),
  amount: positiveNumberSchema,
});

export const updateBazarEntrySchema = z.object({
  id: z.string().min(1, "Entry ID is required"),
  month: monthSchema.optional(),
  date: dateSchema.optional(),
  description: z.string().min(1, "Description is required").optional(),
  amount: positiveNumberSchema.optional(),
});

export const createAdvanceSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  month: monthSchema,
  date: dateSchema,
  amount: positiveNumberSchema,
});

export const updateAdvanceSchema = z.object({
  id: z.string().min(1, "Entry ID is required"),
  memberId: z.string().min(1, "Member ID is required").optional(),
  month: monthSchema.optional(),
  date: dateSchema.optional(),
  amount: positiveNumberSchema.optional(),
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
  status: z.literal("pending").default("pending"),
});

export const createMonthSchema = z.object({
  month: monthSchema,
  managerId: z.string().min(1, "Manager ID is required"),
  isLocked: z.boolean().default(false),
  closedAt: z.date().optional(),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Invalid date");

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

export const decideMealOffRequestSchema = z.object({
  requestId: objectIdSchema,
  decision: z.enum(["approved", "rejected"], "Decision must be approved or rejected"),
});

export const markNotificationReadSchema = z.object({
  id: objectIdSchema,
});

const loanAmountSchema = z
  .number()
  .refine(Number.isFinite, "Amount must be a finite number")
  .positive("Amount must be greater than zero")
  .max(1_000_000_000, "Amount is too large");

const loanNoteSchema = z.string().trim().max(500, "Note is too long");

export const createOfficeLoanSchema = z.object({
  amount: loanAmountSchema,
  date: isoDateSchema,
  note: loanNoteSchema.optional(),
});

export const updateOfficeLoanSchema = z
  .object({
    id: objectIdSchema,
    amount: loanAmountSchema.optional(),
    date: isoDateSchema.optional(),
    note: loanNoteSchema.optional(),
  })
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.date !== undefined ||
      data.note !== undefined,
    { message: "No fields to update", path: ["id"] }
  );

export const deleteOfficeLoanSchema = z.object({
  id: objectIdSchema,
});

export const createOfficeLoanRepaymentSchema = z.object({
  loanId: objectIdSchema,
  amount: loanAmountSchema,
  date: isoDateSchema,
  note: loanNoteSchema.optional(),
});

export const deleteOfficeLoanRepaymentSchema = z.object({
  loanId: objectIdSchema,
  repaymentId: objectIdSchema,
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type CreateBazarEntryInput = z.infer<typeof createBazarEntrySchema>;
export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>;
export type CreateEggEntryInput = z.infer<typeof createEggEntrySchema>;
export type CreateGuestMealInput = z.infer<typeof createGuestMealSchema>;
export type CreateMealOffRequestInput = z.infer<typeof createMealOffRequestSchema>;
export type DecideMealOffRequestInput = z.infer<typeof decideMealOffRequestSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type CreateMonthInput = z.infer<typeof createMonthSchema>;
export type CreateOfficeLoanInput = z.infer<typeof createOfficeLoanSchema>;
export type UpdateOfficeLoanInput = z.infer<typeof updateOfficeLoanSchema>;
export type CreateOfficeLoanRepaymentInput = z.infer<
  typeof createOfficeLoanRepaymentSchema
>;