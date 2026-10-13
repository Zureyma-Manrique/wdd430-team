"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { focusWithinRing } from "@/components/ui/styles";
import { readApiError } from "@/lib/api/error-body";
import { reviewCreateSchema } from "@/lib/validation/review";

interface ReviewFormProps {
  walkId: string;
  walkerName: string;
}

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Owner's "Leave a review" form for a completed walk (story D1, FR-030). The star rating is a
 * radio group, so the arrow keys move the selection and Space or Enter on the button sends it,
 * with no mouse needed. The same Zod schema the Route Handler uses checks the input first.
 */
export function ReviewForm({ walkId, walkerName }: ReviewFormProps) {
  const router = useRouter();
  const firstStarRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ rating?: string; comment?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) firstStarRef.current?.focus();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = reviewCreateSchema.safeParse({ walkId, rating: rating || undefined, comment });
    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        rating: fieldErrors.rating?.[0] && "Choose a rating from 1 to 5 stars",
        comment: fieldErrors.comment?.[0],
      });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        setErrors({ form: (await readApiError(response)).message });
        setPending(false);
        return;
      }
      // The page re-renders with the saved review in place of this form.
      router.refresh();
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div>
        <Button variant="secondary" aria-label={`Review ${walkerName}`} onClick={() => setOpen(true)}>
          Leave a review
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Review ${walkerName}`}
      className="flex flex-col gap-3 rounded-lg bg-surface-muted p-3"
    >
      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={errors.rating ? `review-${walkId}-rating-error` : undefined}
      >
        <legend className="mb-1 text-sm font-medium text-foreground">Rating</legend>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((value) => (
            <label
              key={value}
              className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary ${focusWithinRing}`}
            >
              <input
                ref={value === 1 ? firstStarRef : undefined}
                type="radio"
                name={`rating-${walkId}`}
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span aria-hidden="true">{value} ★</span>
              <span className="sr-only">{value === 1 ? "1 star" : `${value} stars`}</span>
            </label>
          ))}
        </div>
        {errors.rating ? (
          <p id={`review-${walkId}-rating-error`} className="text-sm font-medium text-danger">
            {errors.rating}
          </p>
        ) : null}
      </fieldset>

      <TextAreaField
        id={`review-${walkId}-comment`}
        label="Comment (optional)"
        rows={3}
        maxLength={1000}
        placeholder={`How was the walk with ${walkerName}?`}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={errors.comment}
      />

      {errors.form ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {errors.form}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Post review"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Never mind
        </Button>
      </div>
    </form>
  );
}
