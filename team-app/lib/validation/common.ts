import { z } from "zod";

/** Opaque database id (cuid/uuid). Restricting the charset rejects path and query tricks early. */
export const entityIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{1,64}$/, { error: "Invalid id" });

/** US ZIP code, 5 digits (the spec's examples are Utah ZIPs such as 84604). */
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, { error: "Enter a 5-digit postal code" });

/** https-only URL. Blocks `javascript:` and `data:` URLs from ever reaching an `href` or `src`. */
export const httpsUrlSchema = z.url({ protocol: /^https$/, error: "Must be an https URL" }).max(2048);

/** Params object for any `[id]` route segment. */
export const idParamsSchema = z.object({ id: entityIdSchema });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * Post-sign-in redirect target. Only same-origin relative paths are allowed, which
 * prevents open redirects (`//evil.com`, `/\evil.com`, `https://evil.com`).
 */
export const callbackUrlSchema = z
  .string()
  .max(512)
  .regex(/^\/(?![/\\])[^\s\\]*$/)
  .catch("/dashboard");

/** Optional free text: trims it and turns an empty string into `undefined`. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `Must be ${max} characters or fewer` })
    .optional()
    .transform((value) => (value ? value : undefined));
}
