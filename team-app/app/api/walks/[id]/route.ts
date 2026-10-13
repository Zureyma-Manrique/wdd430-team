import { z } from "zod";
import { requireRole } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { updateWalk } from "@/lib/data/walks";
import { idParamsSchema, walkUpdateSchema } from "@/lib/validation";

/**
 * PATCH /api/walks/[id]: reschedule a walk or edit its pickup notes (story C5, FR-024).
 * Body: `{ startAt?, durationMinutes?, pickupNotes? }`. A new time resets the status to `PENDING`.
 *
 * Guard order: authentication → role (`403`) → params → body (`400`) → ownership (`404`) → the walk
 * must still be changeable (`409`) → the new slot must be free (`409`).
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/walks/[id]">): Promise<Response> {
  const auth = await requireRole("OWNER", {
    unauthorized: "Sign in to change a walk",
    forbidden: "Only the owner who booked a walk can reschedule it",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const parsedParams = idParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return apiError(404, "NOT_FOUND", "Walk not found");
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }
  const parsed = walkUpdateSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const result = await updateWalk(auth.session.profileId, parsedParams.data.id, parsed.data);
  if (result.ok) {
    return Response.json({ walk: result.walk });
  }
  switch (result.reason) {
    case "NOT_FOUND":
      return apiError(404, "NOT_FOUND", "Walk not found");
    case "CONFLICT":
      return apiError(409, "WALK_LOCKED", "This walk can no longer be changed");
    case "OVERLAP":
      return apiError(409, "WALKER_UNAVAILABLE", "This walker is not available at that time");
  }
}
