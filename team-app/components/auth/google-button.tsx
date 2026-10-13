"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { googleSignInAction } from "@/lib/auth/actions";

interface GoogleButtonProps {
  /** On the sign-up page the role must be chosen first (FR-002); `getRole` reads the current choice. */
  getRole?: () => string | null;
}

/** "Continue with Google" (story A1). Rendered only when Google sign-in is configured. */
export function GoogleButton({ getRole }: GoogleButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setError(null);
    const role = getRole ? getRole() : null;
    if (getRole && !role) {
      setError("Choose Owner or Walker first.");
      return;
    }
    setPending(true);
    try {
      await googleSignInAction(role ?? undefined);
    } catch (thrown) {
      // A successful start throws Next's redirect, which must keep going.
      if (thrown instanceof Error && thrown.message === "NEXT_REDIRECT") throw thrown;
      setError("We couldn't start Google sign-in. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="secondary" className="w-full" onClick={handleClick} disabled={pending}>
        {pending ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
