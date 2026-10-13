"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { readApiError } from "@/lib/api/error-body";
import { walkStartAtSchema } from "@/lib/validation/walk";

interface RescheduleFormProps {
  walkId: string;
  dogName: string;
}

/** Local date + time from the inputs → ISO-8601 UTC. Returns "" when incomplete or invalid. */
function toStartAtIso(date: string, time: string): string {
  if (!date || !time) return "";
  const local = new Date(`${date}T${time}`);
  return Number.isNaN(local.getTime()) ? "" : local.toISOString();
}

/**
 * Owner's "Reschedule" control (story C5, FR-024). The server only shows it for a `PENDING` or
 * `CONFIRMED` walk that starts more than 2 hours away; the Route Handler checks again. A new time
 * sends the walk back to `PENDING`, so the walker has to confirm it again.
 * No `Date.now()` during render: the time-window check runs in the submit handler only.
 */
export function RescheduleForm({ walkId, dogName }: RescheduleFormProps) {
  const router = useRouter();
  const dateRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) dateRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (done) statusRef.current?.focus();
  }, [done]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone(false);
    const parsed = walkStartAtSchema.safeParse(toStartAtIso(date, time));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid date and time");
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      const response = await fetch(`/api/walks/${walkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: parsed.data }),
      });
      if (!response.ok) {
        setError((await readApiError(response)).message);
      } else {
        setOpen(false);
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        {done ? (
          <p
            ref={statusRef}
            tabIndex={-1}
            role="status"
            className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary"
          >
            Rescheduled. The walker has to confirm the new time.
          </p>
        ) : null}
        <div>
          <Button variant="secondary" aria-label={`Reschedule for ${dogName}`} onClick={() => setOpen(true)}>
            Reschedule
          </Button>
        </div>
      </div>
    );
  }

  const a11y = {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `reschedule-${walkId}-error` : undefined,
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Reschedule ${dogName}'s walk`}
      className="flex flex-col gap-3 rounded-lg bg-surface-muted p-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <TextField
          ref={dateRef}
          id={`reschedule-${walkId}-date`}
          label="New date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          {...a11y}
        />
        <TextField
          id={`reschedule-${walkId}-time`}
          label="New time"
          type="time"
          step={900}
          value={time}
          onChange={(event) => setTime(event.target.value)}
          {...a11y}
        />
      </div>
      {error ? (
        <p id={`reschedule-${walkId}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted">
          At least 1 hour from now, in your local time. The walker will need to confirm again.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save new time"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Never mind
        </Button>
      </div>
    </form>
  );
}
