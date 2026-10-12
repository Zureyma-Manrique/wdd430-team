import { z } from "zod";
import { requireRole, requireSignedIn } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { getDogForOwner } from "@/lib/data/dogs";
import { createWalk, listWalks } from "@/lib/data/walks";
import { getWalkerById } from "@/lib/data/walkers";
import { walkCreateSchema, walkListQuerySchema } from "@/lib/validation";

/**
 * GET /api/walks: my walks (story C4, FR-025). An owner gets the walks they booked, a walker the
 * walks assigned to them. Query: `from`, `to` (dates in `tz`), `tz`, `status` (comma-separated),
 * `dogId`, `page`, `pageSize`.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await requireSignedIn("Sign in to see your walks");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = walkListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the filters in the address", { formErrors, fieldErrors });
  }

  const { walks, total } = await listWalks(auth.session, parsed.data);
  return Response.json({ walks, page: parsed.data.page, pageSize: parsed.data.pageSize, total });
}

/**
 * POST /api/walks: request a walk (story C2, FR-020 to FR-022) → `201` with status `PENDING`.
 *
 * Guard order: authentication → role → input validation → ownership → persistence.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await requireRole("OWNER", {
    unauthorized: "Sign in to book a walk",
    forbidden: "Only owner accounts can book walks",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }

  const parsed = walkCreateSchema.safeParse(read.body);
  if (!parsed.success) {
    // formErrors carries object-level issues such as unexpected keys (`ownerId`, `status`).
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  // The owner id comes from the session, never the body. Another owner's dog is a 404 (FR-004).
  const dog = await getDogForOwner(auth.session.profileId, parsed.data.dogId);
  if (!dog) {
    return apiError(404, "NOT_FOUND", "Dog not found");
  }
  const walker = await getWalkerById(parsed.data.walkerId);
  if (!walker) {
    return apiError(404, "NOT_FOUND", "Walker not found");
  }

  const result = await createWalk(auth.session.profileId, parsed.data);
  if (!result.ok) {
    return apiError(409, "WALKER_UNAVAILABLE", "This walker is not available at that time");
  }
  return Response.json({ walk: result.walk }, { status: 201 });
}
