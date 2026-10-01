"use client";

import { signIn } from "next-auth/react";
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
 * Any failure shows one generic message, so the form never reveals which field was wrong or
 * whether an account exists (scenario 2).
 */
export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: data.get("email") ?? "",
      password: data.get("password") ?? "",
    });

    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setPending(true);
    try {
      const result = await signIn("credentials", { ...parsed.data, redirectTo: callbackUrl, redirect: false });
      if (!result.ok || result.error || !result.url) {
        setFormError("Invalid email or password");
        setPending(false);
        return;
      }
      // Full page load to the URL Auth.js approved, not a client-side navigation: the client
      // router may still hold a cached "redirect to sign-in" from before the session existed.
      // `pending` stays on so the button can't send a second sign-in while the page loads.
      window.location.assign(result.url);
    } catch {
      setFormError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {formError}
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
