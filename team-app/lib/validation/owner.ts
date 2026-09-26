import { z } from "zod";
import { postalCodeSchema } from "./common";

/** Digits with optional `+`, spaces, dots, dashes and parentheses, e.g. `(801) 555-0142`. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ().-]{7,20}$/, { error: "Enter a valid phone number", abort: true })
  .refine((value) => value.replace(/\D/g, "").length >= 7, { error: "Enter a valid phone number" });

// PATCH /api/owners/me (story A3). `null` clears phone or postal code.
export const ownerProfileUpdateSchema = z
  .strictObject({
    name: z.string().trim().min(1, { error: "Enter your name" }).max(80, { error: "Name must be 80 characters or fewer" }),
    phone: phoneSchema.nullable(),
    postalCode: postalCodeSchema.nullable(),
  })
  .partial();
export type OwnerProfileUpdateInput = z.infer<typeof ownerProfileUpdateSchema>;
