"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { FormNotice, useFormNotice } from "@/components/ui/form-notice";
import { firstFieldErrors, readApiError } from "@/lib/api/error-body";
import { ownerProfileUpdateSchema } from "@/lib/validation/owner";

type FieldName = "name" | "phone" | "postalCode";
type FieldErrors = Partial<Record<FieldName, string>>;

interface OwnerProfileFormProps {
  owner: { name: string; phone: string | null; postalCode: string | null };
}

/** An empty optional box becomes `null`, which clears the saved value. */
function blankToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function pickFieldErrors(fieldErrors: Record<string, string | undefined>): FieldErrors {
  return { name: fieldErrors.name, phone: fieldErrors.phone, postalCode: fieldErrors.postalCode };
}

/**
 * Owner profile editor (story A3): name, phone and neighborhood postal code. Validates with the
 * same Zod schema as `PATCH /api/owners/me`, which checks the body again on the server.
 */
export function OwnerProfileForm({ owner }: OwnerProfileFormProps) {
  const router = useRouter();
  const { notice, noticeRef, showNotice, clearNotice } = useFormNotice();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = ownerProfileUpdateSchema.safeParse({
      name: String(data.get("name") ?? ""),
      phone: blankToNull(data.get("phone")),
      postalCode: blankToNull(data.get("postalCode")),
    });

    if (!parsed.success) {
      setErrors(pickFieldErrors(firstFieldErrors(z.flattenError(parsed.error).fieldErrors)));
      clearNotice();
      return;
    }

    setErrors({});
    clearNotice();
    setPending(true);
    try {
      const response = await fetch("/api/owners/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const apiError = await readApiError(response);
        setErrors(pickFieldErrors(apiError.fieldErrors));
        showNotice({ tone: "error", message: apiError.message });
        return;
      }
      showNotice({ tone: "success", message: "Profile saved." });
      // Re-render server components so the header and dashboard greeting show the new name.
      router.refresh();
    } catch {
      showNotice({ tone: "error", message: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormNotice notice={notice} noticeRef={noticeRef} />

      <TextField
        id="owner-name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        maxLength={80}
        defaultValue={owner.name}
        error={errors.name}
      />
      <TextField
        id="owner-phone"
        name="phone"
        type="tel"
        label="Phone (optional)"
        autoComplete="tel"
        defaultValue={owner.phone ?? ""}
        hint="Your walker uses this to reach you about a walk."
        error={errors.phone}
      />
      <TextField
        id="owner-postal-code"
        name="postalCode"
        label="Neighborhood postal code (optional)"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        defaultValue={owner.postalCode ?? ""}
        hint="5-digit ZIP code, used to find walkers near you."
        error={errors.postalCode}
      />

      <Button type="submit" className="w-full sm:w-auto sm:self-start" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
