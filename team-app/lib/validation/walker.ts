import { z } from "zod";
import { clearableText, httpsUrlSchema, postalCodeSchema } from "./common";

export const WALKER_SORTS = ["rating", "price"] as const;
export type WalkerSort = (typeof WALKER_SORTS)[number];

export const MIN_RATING_OPTIONS = [3, 4, 4.5] as const;

/** Blank form fields arrive as `""`; treat them as "not set". */
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

/** Walker directory filters from the URL query string (FR-041). */
export const walkerSearchParamsSchema = z.object({
  postalCode: z.preprocess(blankToUndefined, postalCodeSchema.optional()),
  minRating: z.preprocess(blankToUndefined, z.coerce.number().pipe(z.literal(MIN_RATING_OPTIONS)).optional()),
  sort: z.preprocess(blankToUndefined, z.enum(WALKER_SORTS).default("rating")),
});
export type WalkerSearchParams = z.infer<typeof walkerSearchParamsSchema>;

// PATCH /api/walkers/me (FR-040)
export const walkerProfileUpdateSchema = z
  .strictObject({
    bio: clearableText(500),
    serviceAreaPostalCodes: z
      .array(postalCodeSchema)
      .min(1, { error: "Add at least one postal code" })
      .max(10, { error: "Add at most 10 postal codes" })
      .refine((codes) => new Set(codes).size === codes.length, { error: "List each postal code only once" }),
    hourlyRate: z
      .number({ error: "Enter an hourly rate" })
      .int({ error: "Use whole dollars" })
      .min(5, { error: "Rate must be at least $5" })
      .max(200, { error: "Rate must be $200 or less" }),
    // `null` removes the photo.
    photoUrl: httpsUrlSchema.nullable(),
    isActive: z.boolean(),
  })
  .partial();
export type WalkerProfileUpdateInput = z.infer<typeof walkerProfileUpdateSchema>;
