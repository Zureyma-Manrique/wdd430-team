"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function WalkersError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // TODO: send to an error-reporting service. Never render `error.message` to users;
    // it may contain internal details. The digest is safe to show for support requests.
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">We couldn&apos;t load walkers</h1>
      <p className="text-muted">Something went wrong on our side. Please try again.</p>
      {error.digest ? <p className="font-mono text-xs text-muted">Reference: {error.digest}</p> : null}
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
