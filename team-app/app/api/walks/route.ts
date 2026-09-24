import { z } from "zod";
import { apiError, readJsonBody } from "@/lib/api/http";
import { getSession } from "@/lib/auth/session";
import { getDogForOwner } from "@/lib/data/dogs";
import { getWalkerById } from "@/lib/data/walkers";
import { walkCreateSchema } from "@/lib/validation";

/**
 * POST /api/walks: request a walk (story C2, FR-020 to FR-022).
 *
 * Guard order: authentication → role → input validation → ownership → persistence.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return apiError(401, "UNAUTHORIZED", "Sign in to book a walk");
  }
  if (session.role !== "OWNER") {
    return apiError(403, "FORBIDDEN", "Only owner accounts can book walks");
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
  const dog = await getDogForOwner(session.profileId, parsed.data.dogId);
  if (!dog) {
    return apiError(404, "NOT_FOUND", "Dog not found");
  }
  const walker = await getWalkerById(parsed.data.walkerId);
  if (!walker) {
    return apiError(404, "NOT_FOUND", "Walker not found");
  }

  // TODO(feature/schedule-api): insert the PENDING booking with Prisma and return 201.
  // The Postgres exclusion constraint on (walkerId, tstzrange) enforces FR-022; map its
  // violation to 409 "This walker is not available at that time".
  return apiError(
    501,
    "NOT_IMPLEMENTED",
    `Your request for ${dog.name} with ${walker.displayName} is valid, but bookings can't be saved until the database is connected.`,
  );
}
