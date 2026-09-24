import { z } from "zod";
import { USER_ROLES } from "@/lib/types";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Enter a valid email address" }));

export const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters" })
  .max(128, { error: "Password must be 128 characters or fewer" });

export const signInSchema = z.object({
  email: emailSchema,
  // Sign-in only checks presence; strength rules apply at sign-up.
  password: z.string().min(1, { error: "Enter your password" }).max(128),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter your name" }).max(80),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(USER_ROLES, { error: "Choose Owner or Walker" }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;
