"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { FormNotice, useFormNotice } from "@/components/ui/form-notice";
import { focusWithinRing } from "@/components/ui/styles";
import { firstFieldErrors, readApiError } from "@/lib/api/error-body";
import type { Walker } from "@/lib/types";
import { walkerProfileUpdateSchema } from "@/lib/validation/walker";

type FieldName = "bio" | "serviceAreaPostalCodes" | "hourlyRate" | "photoUrl";
type FieldErrors = Partial<Record<FieldName, string>>;

interface WalkerProfileFormProps {
  walker: Pick<Walker, "bio" | "serviceAreaPostalCodes" | "hourlyRate" | "photoUrl" | "isActive">;
}

/**
 * "84604, 84601 84604" → ["84604", "84601"]. Repeats are dropped so they don't count toward the
 * 10-code limit; the schema then checks each code (and rejects repeats sent to the API directly).
 */
function parsePostalCodes(value: string): string[] {
  return [...new Set(value.split(/[\s,]+/).filter(Boolean))];
}

/** An empty rate box becomes `undefined`, so the schema reports "Enter an hourly rate". */
function parseRate(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function pickFieldErrors(fieldErrors: Record<string, string | undefined>): FieldErrors {
  return {
    bio: fieldErrors.bio,
    serviceAreaPostalCodes: fieldErrors.serviceAreaPostalCodes,
    hourlyRate: fieldErrors.hourlyRate,
    photoUrl: fieldErrors.photoUrl,
  };
}

/**
 * Walker profile editor (story A3, FR-040). Validates with the same Zod schema as
 * `PATCH /api/walkers/me`, which checks the body again on the server.
 */
export function WalkerProfileForm({ walker }: WalkerProfileFormProps) {
  const router = useRouter();
  const { notice, noticeRef, showNotice, clearNotice } = useFormNotice();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const photoUrl = String(data.get("photoUrl") ?? "").trim();
    // Every field is sent, so the saved profile always matches what's on screen.
    const parsed = walkerProfileUpdateSchema.safeParse({
      bio: String(data.get("bio") ?? ""),
      serviceAreaPostalCodes: parsePostalCodes(String(data.get("serviceAreaPostalCodes") ?? "")),
      hourlyRate: parseRate(String(data.get("hourlyRate") ?? "")),
      photoUrl: photoUrl === "" ? null : photoUrl,
      isActive: data.get("isActive") === "on",
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
      const response = await fetch("/api/walkers/me", {
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
      // Re-render server components (dashboard prompt, header) with the saved profile.
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

      <TextAreaField
        id="walker-bio"
        name="bio"
        label="Bio"
        rows={4}
        maxLength={500}
        defaultValue={walker.bio ?? ""}
        hint="Up to 500 characters. Tell owners about your experience with dogs."
        error={errors.bio}
      />
      <TextField
        id="walker-postal-codes"
        name="serviceAreaPostalCodes"
        label="Service area postal codes"
        defaultValue={walker.serviceAreaPostalCodes.join(", ")}
        hint="5-digit ZIP codes separated by commas, up to 10."
        error={errors.serviceAreaPostalCodes}
      />
      <TextField
        id="walker-hourly-rate"
        name="hourlyRate"
        type="number"
        label="Hourly rate (USD)"
        inputMode="numeric"
        min={5}
        max={200}
        step={1}
        defaultValue={walker.hourlyRate ?? ""}
        hint="Whole dollars, $5 to $200."
        error={errors.hourlyRate}
      />
      <TextField
        id="walker-photo-url"
        name="photoUrl"
        type="url"
        label="Photo URL (optional)"
        defaultValue={walker.photoUrl ?? ""}
        hint="An https link to a photo of you. Leave empty for no photo."
        error={errors.photoUrl}
      />

      <label className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg ${focusWithinRing}`}>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={walker.isActive}
          className="mt-1 size-4 accent-primary focus-visible:outline-none"
        />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Accepting new walks</span>
          <span className="text-sm text-muted">Turn this off to hide your profile from search.</span>
        </span>
      </label>

      <Button type="submit" className="w-full sm:w-auto sm:self-start" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
