import { z } from "zod";

/*
 * Client-safe reader for the spec §6 error body. `lib/api/http.ts` is server-only, so forms
 * import this instead.
 */

const apiErrorBodySchema = z.object({
  error: z.object({
    message: z.string(),
    details: z.object({ fieldErrors: z.record(z.string(), z.array(z.string())) }).optional(),
  }),
});

export interface ApiErrorResult {
  message: string;
  /** First message per field, e.g. `{ hourlyRate: "Rate must be at least $5" }`. */
  fieldErrors: Record<string, string | undefined>;
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Keeps the first message per field, from `z.flattenError(...).fieldErrors` or an API body. */
export function firstFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]));
}

/** Reads a failed response's error body without trusting its shape. */
export async function readApiError(response: Response): Promise<ApiErrorResult> {
  const parsed = apiErrorBodySchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    return { message: FALLBACK_MESSAGE, fieldErrors: {} };
  }
  return {
    message: parsed.data.error.message,
    fieldErrors: firstFieldErrors(parsed.data.error.details?.fieldErrors ?? {}),
  };
}
