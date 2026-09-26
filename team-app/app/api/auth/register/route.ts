import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiError, readJsonBody } from "@/lib/api/http";
import { PASSWORD_HASH_ROUNDS } from "@/lib/auth/auth";
import { createUser } from "@/lib/data/users";
import { signUpSchema } from "@/lib/validation";

/**
 * POST /api/auth/register: create a credentials account (story A1, FR-001, FR-002).
 *
 * Public. The client signs in with Auth.js right after a `201`, so this route never sets
 * a session cookie itself.
 */
export async function POST(request: Request): Promise<Response> {
  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }

  const parsed = signUpSchema.safeParse(read.body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return apiError(400, "VALIDATION_ERROR", "Check the highlighted fields", { formErrors, fieldErrors });
  }

  const { name, email, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  const result = await createUser({ name, email, role, passwordHash });
  if (!result.ok) {
    return apiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  const { user } = result;
  return Response.json({ user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
}
