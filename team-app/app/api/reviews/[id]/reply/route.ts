import { z } from "zod";
import { requireRole } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { replyToReview } from "@/lib/data/reviews";
import { idParamsSchema, reviewReplySchema } from "@/lib/validation";

/**
 * PUT /api/reviews/[id]/reply: the reviewed walker posts, or replaces, their one reply
 * (story D4, FR-033). Body: `{ reply }`, 1 to 500 characters.
 * Guard order: authentication → role → params → body → ownership (`404`: someone else's review).
 */
export async function PUT(request: Request, { params }: RouteContext<"/api/reviews/[id]/reply">): Promise<Response> {
  const auth = await requireRole("WALKER", {
    unauthorized: "Sign in to reply to a review",
    forbidden: "Only walker accounts can reply to reviews",
  });
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
  const parsed = reviewReplySchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const review = await replyToReview(auth.session, parsedParams.data.id, parsed.data.reply);
  return review ? Response.json({ review }) : apiError(404, "NOT_FOUND", "Review not found");
}
