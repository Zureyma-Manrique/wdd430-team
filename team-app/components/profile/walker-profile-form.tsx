"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import type { Walker } from "@/lib/types";
import { walkerProfileUpdateSchema } from "@/lib/validation/walker";

type FieldName = "bio" | "serviceAreaPostalCodes" | "hourlyRate" | "photoUrl";
type FieldErrors = Partial<Record<FieldName, string>>;
type Notice = { tone: "success" | "error"; message: string };

interface WalkerProfileFormProps {
  walker: Pick<Walker, "bio" | "serviceAreaPostalCodes" | "hourlyRate" | "photoUrl" | "isActive">;
}

const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    details: z.object({ fieldErrors: z.record(z.string(), z.array(z.string())) }).optional(),
  }),
});

/** "84604, 84601 84602" → ["84604", "84601", "84602"]. The schema then checks each code. */
function parsePostalCodes(value: string): string[] {
  return value.split(/[\s,]+/).filter(Boolean);
}

/** An empty rate box becomes `undefined`, so the schema reports "Enter an hourly rate". */
function parseRate(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function pickFieldErrors(fieldErrors: Record<string, string[] | undefined>): FieldErrors {
  return {
    bio: fieldErrors.bio?.[0],
    serviceAreaPostalCodes: fieldErrors.serviceAreaPostalCodes?.[0],
    hourlyRate: fieldErrors.hourlyRate?.[0],
    photoUrl: fieldErrors.photoUrl?.[0],
  };
}

/**
 * Walker profile editor (story A3, FR-040). Validates with the same Zod schema as
 * `PATCH /api/walkers/me`, which checks the body again on the server.
 */
export function WalkerProfileForm({ walker }: WalkerProfileFormProps) {
  const router = useRouter();
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);

  function showNotice(next: Notice) {
    setNotice(next);
    // Move focus to the result so screen reader and keyboard users hear it.
    requestAnimationFrame(() => noticeRef.current?.focus());
  }

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
      setErrors(pickFieldErrors(z.flattenError(parsed.error).fieldErrors));
      setNotice(null);
      return;
    }

    setErrors({});
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch("/api/walkers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = apiErrorSchema.safeParse(await response.json().catch(() => null));
        if (body.success && body.data.error.details) {
          setErrors(pickFieldErrors(body.data.error.details.fieldErrors));
        }
        showNotice({
          tone: "error",
          message: body.success ? body.data.error.message : "Something went wrong. Please try again.",
        });
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
      {notice ? (
        <p
          ref={noticeRef}
          tabIndex={-1}
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            "rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none " +
            (notice.tone === "success" ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger")
          }
        >
          {notice.message}
        </p>
      ) : null}

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
        inputMode="numeric"
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

      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
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
