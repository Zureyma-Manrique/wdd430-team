import { z } from "zod";
import { DOG_SIZES } from "@/lib/types";
import { clearableText, httpsUrlSchema, optionalText } from "./common";

const birthDateSchema = z.iso
  .date({ error: "Enter a valid date" })
  .refine((value) => new Date(`${value}T00:00:00Z`).getTime() <= Date.now(), {
    error: "Birth date can't be in the future",
  });

// FR-011
export const dogCreateSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a name" })
    .max(50, { error: "Name must be 50 characters or fewer" }),
  size: z.enum(DOG_SIZES, { error: "Choose a size" }),
  breed: optionalText(60),
  birthDate: birthDateSchema.optional(),
  weightKg: z.number().min(0.5).max(120).optional(),
  notes: optionalText(1000),
  photoUrl: httpsUrlSchema.optional(),
});
export type DogCreateInput = z.infer<typeof dogCreateSchema>;

// PATCH /api/dogs/[id]: optional text fields can be cleared with "" or null.
export const dogUpdateSchema = dogCreateSchema
  .extend({
    breed: clearableText(60),
    notes: clearableText(1000),
    birthDate: birthDateSchema.nullable(),
    weightKg: z.number().min(0.5).max(120).nullable(),
    photoUrl: httpsUrlSchema.nullable(),
  })
  .partial();
export type DogUpdateInput = z.infer<typeof dogUpdateSchema>;
