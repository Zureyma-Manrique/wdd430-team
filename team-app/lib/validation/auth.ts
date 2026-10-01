import { z } from "zod";
import { USER_ROLES } from "@/lib/types";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Enter a valid email address" }));

/**
 * bcrypt only uses the first 72 bytes of a password (NFR-003). Longer passwords would let a
 * different password with the same first 72 bytes sign in, so they are rejected instead.
 */
export const PASSWORD_MAX_BYTES = 72;

export function passwordFitsBcrypt(value: string): boolean {
  return new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES;
}

export const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters" })
  .refine(passwordFitsBcrypt, { error: "Password must be 72 characters or fewer" });

export const signInSchema = z.strictObject({
  email: emailSchema,
  // Sign-in only checks presence; strength rules apply at sign-up. `authorize()` rejects
  // passwords over the bcrypt byte cap with the generic failure message.
  password: z.string().min(1, { error: "Enter your password" }).max(128),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "Enter your name" }).max(80),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(USER_ROLES, { error: "Choose Owner or Walker" }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;
