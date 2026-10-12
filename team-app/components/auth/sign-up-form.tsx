"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { focusWithinRing } from "@/components/ui/styles";
import { firstFieldErrors, readApiError } from "@/lib/api/error-body";
import { signUpSchema } from "@/lib/validation/auth";
import type { UserRole } from "@/lib/types";

type FieldName = "name" | "email" | "password" | "role";
type FieldErrors = Partial<Record<FieldName, string>>;

const ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; label: string; description: string }> = [
  { value: "OWNER", label: "Owner", description: "I want to book walks for my dog." },
  { value: "WALKER", label: "Walker", description: "I want to walk dogs in my area." },
];

function pickFieldErrors(fieldErrors: Record<string, string | undefined>): FieldErrors {
  return { name: fieldErrors.name, email: fieldErrors.email, password: fieldErrors.password, role: fieldErrors.role };
}

/**
 * Sign-up form (story A1). Validates with the shared Zod schema, creates the account through
 * `POST /api/auth/register`, then signs in and lands on `/dashboard`.
 */
export function SignUpForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      name: data.get("name") ?? "",
      email: data.get("email") ?? "",
      password: data.get("password") ?? "",
      role: data.get("role") ?? "",
    });

    if (!parsed.success) {
      setErrors(pickFieldErrors(firstFieldErrors(z.flattenError(parsed.error).fieldErrors)));
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const apiError = await readApiError(response);
        if (response.status === 409) {
          setErrors({ email: "An account with this email already exists" });
        } else if (Object.keys(apiError.fieldErrors).length > 0) {
          setErrors(pickFieldErrors(apiError.fieldErrors));
        } else {
          setFormError(apiError.message);
        }
        setPending(false);
        return;
      }

      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirectTo: "/dashboard",
        redirect: false,
      });
      if (!result.ok || result.error || !result.url) {
        // The account exists; only the automatic sign-in failed.
        setFormError("Your account was created, but we couldn't sign you in. Please sign in.");
        setPending(false);
        return;
      }
      // Full page load so no route cached while signed out is reused (see SignInForm). `pending`
      // stays on while the next page loads.
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

      <fieldset aria-describedby={errors.role ? "sign-up-role-error" : undefined} className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-foreground">I am a…</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 has-checked:border-primary has-checked:bg-primary-soft ${focusWithinRing}`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                required
                className="mt-1 size-4 accent-primary focus-visible:outline-none"
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{option.label}</span>
                <span className="text-sm text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.role ? (
          <p id="sign-up-role-error" className="text-sm font-medium text-danger">
            {errors.role}
          </p>
        ) : null}
      </fieldset>

      <TextField
        id="sign-up-name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        maxLength={80}
        error={errors.name}
      />
      <TextField
        id="sign-up-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.email}
      />
      <TextField
        id="sign-up-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        hint="8 to 72 characters."
        error={errors.password}
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
