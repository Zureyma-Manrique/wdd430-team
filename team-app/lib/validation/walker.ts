import { z } from "zod";
import { httpsUrlSchema, optionalText, postalCodeSchema } from "./common";

export const WALKER_SORTS = ["rating", "price"] as const;
export type WalkerSort = (typeof WALKER_SORTS)[number];

export const MIN_RATING_OPTIONS = [3, 4, 4.5] as const;

/** Blank form fields arrive as `""`; treat them as "not set". */
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

/** Walker directory filters from the URL query string (FR-041). */
export const walkerSearchParamsSchema = z.object({
  postalCode: z.preprocess(blankToUndefined, postalCodeSchema.optional()),
  minRating: z.preprocess(blankToUndefined, z.coerce.number().min(1).max(5).optional()),
  sort: z.preprocess(blankToUndefined, z.enum(WALKER_SORTS).default("rating")),
});
export type WalkerSearchParams = z.infer<typeof walkerSearchParamsSchema>;

// PATCH /api/walkers/me (FR-040)
export const walkerProfileUpdateSchema = z
  .strictObject({
    bio: optionalText(500),
    serviceAreaPostalCodes: z.array(postalCodeSchema).min(1).max(10),
    hourlyRate: z
      .number()
      .min(5, { error: "Rate must be at least $5" })
      .max(200, { error: "Rate must be $200 or less" }),
    photoUrl: httpsUrlSchema,
    isActive: z.boolean(),
  })
  .partial();
export type WalkerProfileUpdateInput = z.infer<typeof walkerProfileUpdateSchema>;
