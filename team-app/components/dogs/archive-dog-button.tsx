"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/api/error-body";

interface ArchiveDogButtonProps {
  dogId: string;
  dogName: string;
}

/**
 * "Remove" for a dog (story B2, FR-013). It archives the dog instead of erasing it, so past walks
 * and reviews keep their record. Asks first, and moves focus to the question so keyboard and
 * screen reader users land on it.
 */
export function ArchiveDogButton({ dogId, dogName }: ArchiveDogButtonProps) {
  const router = useRouter();
  const questionRef = useRef<HTMLParagraphElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (confirming) questionRef.current?.focus();
  }, [confirming]);

  async function archive() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/dogs/${dogId}`, { method: "DELETE" });
      if (!response.ok) {
        setError((await readApiError(response)).message);
        setPending(false);
        return;
      }
      router.push("/dogs");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Remove {dogName}
      </Button>
    );
  }

  return (
    <div role="group" aria-labelledby="archive-question" className="flex flex-col gap-3 rounded-lg bg-danger-soft p-4">
      <p id="archive-question" ref={questionRef} tabIndex={-1} className="text-sm font-medium text-foreground focus-visible:outline-none">
        Remove {dogName}? They will disappear from your dogs, but past walks and reviews keep their record.
      </p>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="danger" onClick={archive} disabled={pending}>
          {pending ? "Removing…" : `Yes, remove ${dogName}`}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
          Keep {dogName}
        </Button>
      </div>
    </div>
  );
}
