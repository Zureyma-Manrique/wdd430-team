import { z } from "zod";
import { apiError, readJsonBody } from "@/lib/api/http";
import { getSession } from "@/lib/auth/session";
import { getOwnOwnerProfile, updateOwnerProfile } from "@/lib/data/owners";
import { findUserById, updateUserName } from "@/lib/data/users";
import type { PetOwner, SessionUser } from "@/lib/types";
import { ownerProfileUpdateSchema } from "@/lib/validation";

type OwnerSessionResult = { ok: true; session: SessionUser } | { ok: false; response: Response };

/** Authentication → role. Only owner accounts have an owner profile (mirrors /api/walkers/me). */
async function requireOwner(): Promise<OwnerSessionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "Sign in to manage your profile") };
  }
  if (session.role !== "OWNER") {
    return { ok: false, response: apiError(403, "FORBIDDEN", "Only owner accounts have an owner profile") };
  }
  return { ok: true, session };
}

function toBody(owner: PetOwner, name: string) {
  return { owner: { id: owner.id, name, phone: owner.phone, postalCode: owner.postalCode } };
}

/** GET /api/owners/me: my name, phone and neighborhood postal code (story A3). */
export async function GET(): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }

  const owner = await getOwnOwnerProfile(auth.session.profileId);
  if (!owner) {
    return apiError(404, "NOT_FOUND", "Owner profile not found");
  }
  return Response.json(toBody(owner, auth.session.name));
}

/** PATCH /api/owners/me: update `{ name?, phone?, postalCode? }`. `null` clears phone or postal code. */
export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return auth.response;
  }

  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }

  const parsed = ownerProfileUpdateSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  // Ids come from the session, so an owner can only ever edit their own profile. Both records
  // are checked before either is written, so a `404` never leaves a half-saved change.
  // TODO(feature/data-model): wrap both writes in one `prisma.$transaction`.
  const { name, ...profile } = parsed.data;
  if (!(await getOwnOwnerProfile(auth.session.profileId)) || !(await findUserById(auth.session.id))) {
    return apiError(404, "NOT_FOUND", "Owner profile not found");
  }

  const account = name === undefined ? null : await updateUserName(auth.session.id, name);
  const owner = await updateOwnerProfile(auth.session.profileId, profile);
  if (!owner) {
    return apiError(404, "NOT_FOUND", "Owner profile not found");
  }
  return Response.json(toBody(owner, account?.name ?? auth.session.name));
}
