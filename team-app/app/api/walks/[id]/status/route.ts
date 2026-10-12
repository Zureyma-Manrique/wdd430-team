import { z } from "zod";
import { requireSignedIn } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { changeWalkStatus } from "@/lib/data/walks";
import { idParamsSchema, walkStatusChangeSchema } from "@/lib/validation";

/**
 * POST /api/walks/[id]/status: change a walk's status (FR-023).
 * Body: `{ action: "accept" | "decline" | "cancel" | "start" | "complete", reason?, sessionNotes? }`.
 *
 * Guard order: authentication → params → body → ownership (`404`) → role for the action (`403`)
 * → legal transition (`409`). Which role may do what is in `lib/walks/transitions.ts`.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/walks/[id]/status">): Promise<Response> {
  const auth = await requireSignedIn("Sign in to manage your walks");
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
  const parsed = walkStatusChangeSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const result = await changeWalkStatus(auth.session, parsedParams.data.id, parsed.data);
  if (result.ok) {
    return Response.json({ walk: result.walk });
  }
  switch (result.reason) {
    case "NOT_FOUND":
      return apiError(404, "NOT_FOUND", "Walk not found");
    case "FORBIDDEN":
      return apiError(403, "FORBIDDEN", "Your account can't do that to this walk");
    case "TOO_EARLY":
      return apiError(409, "TOO_EARLY", "A walk can be started up to 15 minutes before its start time");
    case "CONFLICT":
      return apiError(409, "INVALID_STATUS_CHANGE", "That change isn't possible for the walk's current status");
  }
}
