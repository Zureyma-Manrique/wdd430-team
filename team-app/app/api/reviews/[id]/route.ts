import { z } from "zod";
import { requireRole } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { deleteReview, updateReview } from "@/lib/data/reviews";
import { idParamsSchema, reviewUpdateSchema } from "@/lib/validation";

const MESSAGES = {
  unauthorized: "Sign in to change a review",
  forbidden: "Only owner accounts can change reviews",
};

/**
 * PATCH /api/reviews/[id]: edit my review (story D3, FR-032). Body: `{ rating?, comment? }`.
 * Guard order: authentication → role → params → body → ownership (`404`) → 30-day window (`409`).
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/reviews/[id]">): Promise<Response> {
  const auth = await requireRole("OWNER", MESSAGES);
  if (!auth.ok) {
    return auth.response;
  }
  const parsedParams = idParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return apiError(404, "NOT_FOUND", "Review not found");
  }
  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }
  const parsed = reviewUpdateSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const result = await updateReview(auth.session, parsedParams.data.id, parsed.data);
  if (result.ok) {
    return Response.json({ review: result.review });
  }
  return result.reason === "NOT_FOUND"
    ? apiError(404, "NOT_FOUND", "Review not found")
    : apiError(409, "REVIEW_LOCKED", "Reviews can only be edited within 30 days");
}

/** DELETE /api/reviews/[id]: delete my review, at any time (story D3) → `204`. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/reviews/[id]">): Promise<Response> {
  const auth = await requireRole("OWNER", MESSAGES);
  if (!auth.ok) {
    return auth.response;
  }
  const parsedParams = idParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return apiError(404, "NOT_FOUND", "Review not found");
  }
  const deleted = await deleteReview(auth.session, parsedParams.data.id);
  return deleted ? new Response(null, { status: 204 }) : apiError(404, "NOT_FOUND", "Review not found");
}
