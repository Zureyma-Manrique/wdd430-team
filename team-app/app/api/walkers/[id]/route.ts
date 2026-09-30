import { apiError } from "@/lib/api/http";
import { getWalkerById, toPublicWalkerProfile } from "@/lib/data/walkers";
import { idParamsSchema } from "@/lib/validation";

/**
 * GET /api/walkers/[id]: public walker profile with `averageRating` and `reviewCount` (FR-040).
 * Inactive and incomplete profiles are `404`, the same as on the public profile page. Only the
 * public fields are returned, never the account id.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/walkers/[id]">): Promise<Response> {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return apiError(404, "NOT_FOUND", "Walker not found");
  }

  const walker = await getWalkerById(parsed.data.id);
  if (!walker) {
    return apiError(404, "NOT_FOUND", "Walker not found");
  }
  return Response.json({ walker: toPublicWalkerProfile(walker) });
}
