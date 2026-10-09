import { z } from "zod";
import { apiError, readJsonBody } from "@/lib/api/http";
import { requireRole } from "@/lib/api/guards";
import { getOwnWalkerProfile, updateWalkerProfile } from "@/lib/data/walkers";
import { walkerProfileUpdateSchema } from "@/lib/validation";

/** Authentication → role. Only walker accounts have a walker profile (story A3, scenario 4). */
const requireWalker = () =>
  requireRole("WALKER", {
    unauthorized: "Sign in to manage your profile",
    forbidden: "Only walker accounts have a walker profile",
  });

/** GET /api/walkers/me: my walker profile, including incomplete or inactive ones. */
export async function GET(): Promise<Response> {
  const auth = await requireWalker();
  if (!auth.ok) {
    return auth.response;
  }

  const walker = await getOwnWalkerProfile(auth.session.profileId);
  if (!walker) {
    return apiError(404, "NOT_FOUND", "Walker profile not found");
  }
  return Response.json({ walker });
}

/** PATCH /api/walkers/me: update `{ bio?, serviceAreaPostalCodes?, hourlyRate?, photoUrl?, isActive? }` (FR-040). */
export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireWalker();
  if (!auth.ok) {
    return auth.response;
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }

  const parsed = walkerProfileUpdateSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  // The walker id comes from the session, so a walker can only ever edit their own profile.
  const walker = await updateWalkerProfile(auth.session.profileId, parsed.data);
  if (!walker) {
    return apiError(404, "NOT_FOUND", "Walker profile not found");
  }
  return Response.json({ walker });
}
