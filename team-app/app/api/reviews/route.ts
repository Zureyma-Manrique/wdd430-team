import { z } from "zod";
import { requireRole } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { createReview } from "@/lib/data/reviews";
import { reviewCreateSchema } from "@/lib/validation";

/**
 * POST /api/reviews: review a completed walk (story D1, FR-030) → `201`.
 * Body: `{ walkId, rating (1 to 5), comment? }`.
 *
 * Guard order: authentication → role → input validation → ownership (`404`) → the walk must be
 * `COMPLETED` (`409`) → one review per walk (`409`).
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await requireRole("OWNER", {
    unauthorized: "Sign in to review a walk",
    forbidden: "Only owner accounts can review walks",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }
  const parsed = reviewCreateSchema.safeParse(read.body);
  if (!parsed.success) {
    // formErrors carries object-level issues such as unexpected keys (`authorId`, `walkerId`).
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const result = await createReview(auth.session, parsed.data);
  if (result.ok) {
    return Response.json({ review: result.review }, { status: 201 });
  }
  switch (result.reason) {
    case "NOT_FOUND":
      return apiError(404, "NOT_FOUND", "Walk not found");
    case "NOT_COMPLETED":
      return apiError(409, "WALK_NOT_COMPLETED", "You can only review completed walks");
    case "ALREADY_REVIEWED":
      return apiError(409, "ALREADY_REVIEWED", "You already reviewed this walk");
  }
}
