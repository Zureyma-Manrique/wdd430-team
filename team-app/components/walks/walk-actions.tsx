"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/api/error-body";
import type { WalkStatusAction } from "@/lib/types";

interface WalkActionsProps {
  walkId: string;
  /** Computed on the server from the walk's status, the viewer's role and the clock. */
  actions: readonly WalkStatusAction[];
  dogName: string;
}

const LABELS: Record<WalkStatusAction, string> = {
  accept: "Accept",
  decline: "Decline",
  start: "Start walk",
  complete: "Complete walk",
  cancel: "Cancel walk",
};

const QUESTIONS: Partial<Record<WalkStatusAction, string>> = {
  decline: "Decline this request? The owner will be told.",
  cancel: "Cancel this walk? The other person will be told.",
};

/** Buttons that change a walk's status (stories C3 and C5). Declining and cancelling ask first. */
export function WalkActions({ walkId, actions, dogName }: WalkActionsProps) {
  const router = useRouter();
  const questionRef = useRef<HTMLParagraphElement>(null);
  const [confirming, setConfirming] = useState<WalkStatusAction | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (confirming) questionRef.current?.focus();
  }, [confirming]);

  async function run(action: WalkStatusAction) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/walks/${walkId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        setError((await readApiError(response)).message);
        setConfirming(null);
        setPending(false);
        return;
      }
      setConfirming(null);
      setPending(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  if (actions.length === 0) return null;

  if (confirming) {
    return (
      <div
        role="group"
        aria-label={`Confirm for ${dogName}`}
        className="flex flex-col gap-3 rounded-lg bg-danger-soft p-3"
      >
        <p ref={questionRef} tabIndex={-1} className="text-sm font-medium text-foreground focus-visible:outline-none">
          {QUESTIONS[confirming]}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => run(confirming)} disabled={pending}>
            {pending ? "Working…" : `Yes, ${LABELS[confirming].toLowerCase()}`}
          </Button>
          <Button variant="secondary" onClick={() => setConfirming(null)} disabled={pending}>
            Never mind
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const needsConfirmation = action in QUESTIONS;
          return (
            <Button
              key={action}
              variant={needsConfirmation ? "danger" : "primary"}
              disabled={pending}
              aria-label={`${LABELS[action]} for ${dogName}`}
              onClick={() => (needsConfirmation ? setConfirming(action) : run(action))}
            >
              {LABELS[action]}
            </Button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
