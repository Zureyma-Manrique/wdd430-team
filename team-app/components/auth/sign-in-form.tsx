"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { signInSchema } from "@/lib/validation/auth";

interface SignInFormProps {
  /** Same-origin path to return to, already sanitized by the page with `callbackUrlSchema`. */
  callbackUrl: string;
}

type FieldErrors = Partial<Record<"email" | "password", string>>;

/**
 * Credentials sign-in form (story A2). Validates with the shared Zod schema before submitting.
 *
 * TODO(feature/auth): on success call Auth.js `signIn("credentials", { email, password, redirectTo: callbackUrl })`.
 * Keep the single generic failure message ("Invalid email or password") so the form never
 * reveals which field was wrong or whether an account exists.
 */
export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: data.get("email") ?? "",
      password: data.get("password") ?? "",
    });

    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
      setNotice(null);
      return;
    }

    setErrors({});
    setNotice("Sign-in isn't connected yet. Authentication arrives with the feature/auth branch.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {notice ? (
        <p role="status" className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
          {notice}
        </p>
      ) : null}

      <TextField
        id="sign-in-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.email}
      />
      <TextField
        id="sign-in-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        error={errors.password}
      />

      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
