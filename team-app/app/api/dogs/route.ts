import { z } from "zod";
import { requireRole } from "@/lib/api/guards";
import { apiError, readJsonBody } from "@/lib/api/http";
import { createDog, getDogsForOwner } from "@/lib/data/dogs";
import { dogCreateSchema } from "@/lib/validation";

/** Authentication → role. Only owner accounts have dogs. */
const requireOwner = () =>
  requireRole("OWNER", { unauthorized: "Sign in to manage your dogs", forbidden: "Only owner accounts have dogs" });

/** GET /api/dogs: my dogs, oldest first. Archived dogs are left out (story B1). */
export async function GET(): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }

  // The owner id comes from the session, so an owner only ever sees their own dogs (FR-004).
  const dogs = await getDogsForOwner(auth.session.profileId);
  return Response.json({ dogs });
}

/** POST /api/dogs: create a dog `{ name, size, breed?, birthDate?, weightKg?, notes?, photoUrl? }` → `201` (FR-011). */
export async function POST(request: Request): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }

  // `z.strictObject` rejects `ownerId`, `archivedAt` and any other field the client shouldn't set.
  const parsed = dogCreateSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const dog = await createDog(auth.session.profileId, parsed.data);
  return Response.json({ dog }, { status: 201 });
}
