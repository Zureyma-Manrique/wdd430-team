"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { FormNotice, useFormNotice } from "@/components/ui/form-notice";
import { firstFieldErrors, readApiError } from "@/lib/api/error-body";
import { formatDogSize } from "@/lib/format";
import { DOG_SIZES, type DogProfile } from "@/lib/types";
import { dogCreateSchema, dogUpdateSchema } from "@/lib/validation/dog";

type FieldName = "name" | "size" | "breed" | "birthDate" | "weightKg" | "notes" | "photoUrl";
type FieldErrors = Partial<Record<FieldName, string>>;

interface DogFormProps {
  /** Omit to create a dog; pass one to edit it. */
  dog?: DogProfile;
}

const FIELD_NAMES: readonly FieldName[] = ["name", "size", "breed", "birthDate", "weightKg", "notes", "photoUrl"];

function pickFieldErrors(fieldErrors: Record<string, string | undefined>): FieldErrors {
  return Object.fromEntries(FIELD_NAMES.map((field) => [field, fieldErrors[field]]));
}

/** A blank optional box is `null` (clear it) when editing and `undefined` (leave it out) when creating. */
function blank(value: FormDataEntryValue | null, empty: null | undefined): string | null | undefined {
  const text = String(value ?? "").trim();
  return text === "" ? empty : text;
}

function parseWeight(value: FormDataEntryValue | null, empty: null | undefined): number | null | undefined {
  const text = String(value ?? "").trim();
  return text === "" ? empty : Number(text);
}

/**
 * Create / edit form for a dog (stories B1, B2, FR-011, FR-012). Validates with the same Zod
 * schemas as `POST /api/dogs` and `PATCH /api/dogs/[id]`, which check the body again on the server.
 */
export function DogForm({ dog }: DogFormProps) {
  const router = useRouter();
  const isEdit = dog !== undefined;
  const { notice, noticeRef, showNotice, clearNotice } = useFormNotice();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // Creating leaves blank fields out; editing sends `null` so a saved value can be cleared.
    const empty = isEdit ? null : undefined;
    const candidate = {
      name: String(data.get("name") ?? ""),
      size: String(data.get("size") ?? ""),
      breed: blank(data.get("breed"), empty),
      birthDate: blank(data.get("birthDate"), empty),
      weightKg: parseWeight(data.get("weightKg"), empty),
      notes: blank(data.get("notes"), empty),
      photoUrl: blank(data.get("photoUrl"), empty),
    };
    const parsed = (isEdit ? dogUpdateSchema : dogCreateSchema).safeParse(candidate);

    if (!parsed.success) {
      setErrors(pickFieldErrors(firstFieldErrors(z.flattenError(parsed.error).fieldErrors)));
      clearNotice();
      return;
    }

    setErrors({});
    clearNotice();
    setPending(true);
    try {
      const response = await fetch(isEdit ? `/api/dogs/${dog.id}` : "/api/dogs", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const apiError = await readApiError(response);
        setErrors(pickFieldErrors(apiError.fieldErrors));
        showNotice({ tone: "error", message: apiError.message });
        return;
      }
      if (isEdit) {
        showNotice({ tone: "success", message: "Dog saved." });
        router.refresh();
      } else {
        // Leave the form for the list, which now includes the new dog.
        router.push("/dogs");
        router.refresh();
        return; // keep the button disabled while the next page loads
      }
    } catch {
      showNotice({ tone: "error", message: "Something went wrong. Please try again." });
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormNotice notice={notice} noticeRef={noticeRef} />

      <TextField
        id="dog-name"
        name="name"
        label="Name"
        required
        maxLength={50}
        defaultValue={dog?.name ?? ""}
        error={errors.name}
      />
      <SelectField
        id="dog-size"
        name="size"
        label="Size"
        required
        defaultValue={dog?.size ?? ""}
        error={errors.size}
        hint="Walkers use this to match the walk to your dog."
      >
        <option value="" disabled>
          Choose a size
        </option>
        {DOG_SIZES.map((size) => (
          <option key={size} value={size}>
            {formatDogSize(size)}
          </option>
        ))}
      </SelectField>
      <TextField
        id="dog-breed"
        name="breed"
        label="Breed (optional)"
        maxLength={60}
        defaultValue={dog?.breed ?? ""}
        error={errors.breed}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="dog-birth-date"
          name="birthDate"
          type="date"
          label="Birth date (optional)"
          defaultValue={dog?.birthDate ?? ""}
          error={errors.birthDate}
        />
        <TextField
          id="dog-weight"
          name="weightKg"
          type="number"
          inputMode="decimal"
          label="Weight in kg (optional)"
          min={0.5}
          max={120}
          step={0.1}
          defaultValue={dog?.weightKg ?? ""}
          error={errors.weightKg}
        />
      </div>
      <TextAreaField
        id="dog-notes"
        name="notes"
        label="Care notes (optional)"
        rows={4}
        maxLength={1000}
        defaultValue={dog?.notes ?? ""}
        hint="Anything a walker should know: fears, leash habits, medication."
        error={errors.notes}
      />
      <TextField
        id="dog-photo-url"
        name="photoUrl"
        type="url"
        label="Photo URL (optional)"
        defaultValue={dog?.photoUrl ?? ""}
        hint="An https link to a photo. Leave empty for no photo."
        error={errors.photoUrl}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save dog" : "Add dog"}
        </Button>
        <ButtonLink href="/dogs" variant="secondary">
          {isEdit ? "Back to my dogs" : "Cancel"}
        </ButtonLink>
      </div>
    </form>
  );
}
