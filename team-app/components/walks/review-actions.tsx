"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/api/error-body";
import { ReviewForm } from "./review-form";

interface ReviewActionsProps {
  walkId: string;
  walkerName: string;
  review: { id: string; rating: number; comment: string | null };
  /** Computed on the server: editing closes 30 days after the review was written (FR-032). */
  canEdit: boolean;
}

/** The owner's "Edit" and "Delete" controls for their own review (story D3). Deleting asks first. */
export function ReviewActions({ walkId, walkerName, review, canEdit }: ReviewActionsProps) {
  const router = useRouter();
  const questionRef = useRef<HTMLParagraphElement>(null);
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "confirm") questionRef.current?.focus();
  }, [mode]);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError((await readApiError(response)).message);
        setMode("view");
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  if (mode === "edit") {
    return <ReviewForm walkId={walkId} walkerName={walkerName} existing={review} onCancel={() => setMode("view")} />;
  }

  if (mode === "confirm") {
    return (
      <div
        role="group"
        aria-label={`Delete review of ${walkerName}`}
        className="flex flex-col gap-3 rounded-lg bg-danger-soft p-3"
      >
        <p ref={questionRef} tabIndex={-1} className="text-sm font-medium text-foreground focus-visible:outline-none">
          Delete your review? This can&apos;t be undone.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={remove} disabled={pending}>
            {pending ? "Deleting…" : "Yes, delete review"}
          </Button>
          <Button variant="secondary" onClick={() => setMode("view")} disabled={pending}>
            Never mind
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Button variant="secondary" aria-label={`Edit review of ${walkerName}`} onClick={() => setMode("edit")}>
            Edit review
          </Button>
        ) : null}
        <Button variant="danger" aria-label={`Delete review of ${walkerName}`} onClick={() => setMode("confirm")}>
          Delete review
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
