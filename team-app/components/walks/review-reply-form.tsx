"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { readApiError } from "@/lib/api/error-body";
import { reviewReplySchema } from "@/lib/validation/review";

interface ReviewReplyFormProps {
  reviewId: string;
  /** The walker's current reply, if there is one. Posting again replaces it (FR-033). */
  currentReply: string | null;
  ownerName: string;
}

/** The walker's one public reply to a review of them (story D4). */
export function ReviewReplyForm({ reviewId, currentReply, ownerName }: ReviewReplyFormProps) {
  const router = useRouter();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(currentReply ?? "");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) fieldRef.current?.focus();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = reviewReplySchema.safeParse({ reply });
    if (!parsed.success) {
      setError(z.flattenError(parsed.error).fieldErrors.reply?.[0] ?? "Check your reply");
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        setError((await readApiError(response)).message);
        setPending(false);
        return;
      }
      setOpen(false);
      setPending(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div>
        <Button
          variant="secondary"
          aria-label={`${currentReply ? "Edit reply" : "Reply"} to ${ownerName}'s review`}
          onClick={() => setOpen(true)}
        >
          {currentReply ? "Edit reply" : "Reply"}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Reply to ${ownerName}'s review`}
      className="flex flex-col gap-3 rounded-lg bg-surface-muted p-3"
    >
      <TextAreaField
        ref={fieldRef}
        id={`reply-${reviewId}`}
        label="Your public reply"
        rows={3}
        maxLength={500}
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        error={error}
        hint="Shown under the review on your profile. Posting again replaces it."
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Post reply"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Never mind
        </Button>
      </div>
    </form>
  );
}
