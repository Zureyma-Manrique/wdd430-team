import { z } from "zod";
import { requireRole } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { archiveDog, getDogForOwner, updateDog } from "@/lib/data/dogs";
import { dogUpdateSchema, idParamsSchema } from "@/lib/validation";

/** Authentication → role. Only owner accounts have dogs. */
const requireOwner = () =>
  requireRole("OWNER", { unauthorized: "Sign in to manage your dogs", forbidden: "Only owner accounts have dogs" });

const notFound = () => apiError(404, "NOT_FOUND", "Dog not found");

/**
 * Another owner's dog and a dog that doesn't exist look the same: `404` (FR-004). Every query
 * below is scoped by the session's owner id, so ownership can't be skipped by mistake.
 */

/** GET /api/dogs/[id]: one of my dogs. */
export async function GET(_request: Request, { params }: RouteContext<"/api/dogs/[id]">): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }
  const parsedParams = idParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return notFound();
  }

  const dog = await getDogForOwner(auth.session.profileId, parsedParams.data.id);
  return dog ? Response.json({ dog }) : notFound();
}

/** PATCH /api/dogs/[id]: partial update. `""` or `null` clears an optional field (FR-012). */
export async function PATCH(request: Request, { params }: RouteContext<"/api/dogs/[id]">): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }
  const parsedParams = idParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return notFound();
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }
  const parsed = dogUpdateSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const dog = await updateDog(auth.session.profileId, parsedParams.data.id, parsed.data);
  return dog ? Response.json({ dog }) : notFound();
}

/** DELETE /api/dogs/[id]: archive the dog → `204`. `409` while it has an active walk (FR-013). */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/dogs/[id]">): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }
  const parsedParams = idParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return notFound();
  }

  const result = await archiveDog(auth.session.profileId, parsedParams.data.id);
  if (!result.ok) {
    return result.reason === "NOT_FOUND"
      ? notFound()
      : apiError(409, "HAS_UPCOMING_WALKS", "This dog has upcoming walks. Cancel them before removing the dog.");
  }
  return new Response(null, { status: 204 });
}
