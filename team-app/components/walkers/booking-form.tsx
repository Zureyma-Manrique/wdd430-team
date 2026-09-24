"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { WALK_DURATIONS_MINUTES, type DogProfile } from "@/lib/types";
import { walkCreateSchema, type WalkCreateInput } from "@/lib/validation/walk";

interface BookingFormProps {
  walkerId: string;
  walkerName: string;
  dogs: Pick<DogProfile, "id" | "name">[];
}

interface FormValues {
  dogId: string;
  date: string;
  time: string;
  durationMinutes: string;
  pickupNotes: string;
}

type FieldErrors = Partial<Record<"dogId" | "startAt" | "durationMinutes" | "pickupNotes", string>>;

type Stage =
  | { kind: "editing" }
  | { kind: "reviewing"; request: WalkCreateInput }
  | { kind: "sent"; tone: "success" | "error"; message: string };

/** Local date + time from the inputs → ISO-8601 UTC. Returns "" when incomplete or invalid. */
function toStartAtIso(date: string, time: string): string {
  if (!date || !time) return "";
  const local = new Date(`${date}T${time}`);
  return Number.isNaN(local.getTime()) ? "" : local.toISOString();
}

function readErrorMessage(body: unknown): string | null {
  const parsed = z.object({ error: z.object({ message: z.string() }) }).safeParse(body);
  return parsed.success ? parsed.data.error.message : null;
}

/**
 * Walk booking flow (story C2): fill in → review → send.
 * All inputs are validated with the same Zod schema the Route Handler uses, which checks them again.
 * No `Date.now()` during render: time-dependent checks run in event handlers only, which
 * keeps server and client HTML identical (no hydration mismatch).
 */
export function BookingForm({ walkerId, walkerName, dogs }: BookingFormProps) {
  const [values, setValues] = useState<FormValues>({
    dogId: dogs[0]?.id ?? "",
    date: "",
    time: "",
    durationMinutes: "30",
    pickupNotes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<Stage>({ kind: "editing" });
  const [isSending, setIsSending] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate(): WalkCreateInput | null {
    const parsed = walkCreateSchema.safeParse({
      dogId: values.dogId,
      walkerId,
      startAt: toStartAtIso(values.date, values.time),
      durationMinutes: Number(values.durationMinutes),
      pickupNotes: values.pickupNotes,
    });
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    setErrors({
      dogId: fieldErrors.dogId?.[0] && "Choose a dog",
      startAt: fieldErrors.startAt?.[0],
      durationMinutes: fieldErrors.durationMinutes?.[0],
      pickupNotes: fieldErrors.pickupNotes?.[0],
    });
    return null;
  }

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = validate();
    if (request) setStage({ kind: "reviewing", request });
  }

  async function handleSend() {
    // Re-check: the chosen time may have slipped under the 1-hour minimum while reviewing.
    const request = validate();
    if (!request) {
      setStage({ kind: "editing" });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/walks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 201) {
        setStage({ kind: "sent", tone: "success", message: `Request sent! ${walkerName} will confirm soon.` });
      } else {
        setStage({
          kind: "sent",
          tone: "error",
          message: readErrorMessage(body) ?? "We couldn't send your request. Please try again.",
        });
      }
    } catch {
      setStage({ kind: "sent", tone: "error", message: "Network error. Check your connection and try again." });
    } finally {
      setIsSending(false);
    }
  }

  if (dogs.length === 0) {
    return <p className="text-sm text-muted">Add a dog to your profile before booking a walk.</p>;
  }

  if (stage.kind === "reviewing") {
    const { request } = stage;
    const dogName = dogs.find((dog) => dog.id === request.dogId)?.name ?? "Your dog";
    const when = new Date(request.startAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
    return (
      <section aria-labelledby="booking-review-heading" className="flex flex-col gap-4">
        <h3 id="booking-review-heading" className="text-base font-semibold text-foreground">
          Review your request
        </h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Walker</dt>
          <dd className="font-medium text-foreground">{walkerName}</dd>
          <dt className="text-muted">Dog</dt>
          <dd className="font-medium text-foreground">{dogName}</dd>
          <dt className="text-muted">When</dt>
          <dd className="font-medium text-foreground">{when}</dd>
          <dt className="text-muted">Duration</dt>
          <dd className="font-medium text-foreground">{request.durationMinutes} minutes</dd>
          {request.pickupNotes ? (
            <>
              <dt className="text-muted">Pickup notes</dt>
              <dd className="whitespace-pre-line text-foreground">{request.pickupNotes}</dd>
            </>
          ) : null}
        </dl>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleSend} disabled={isSending} className="sm:flex-1">
            {isSending ? "Sending…" : "Send request"}
          </Button>
          <Button variant="secondary" onClick={() => setStage({ kind: "editing" })} disabled={isSending}>
            Edit
          </Button>
        </div>
      </section>
    );
  }

  // Date and time share one error message, so both inputs point at it.
  const startAtA11y = {
    "aria-invalid": errors.startAt ? true : undefined,
    "aria-describedby": errors.startAt ? "booking-start-error" : "booking-start-hint",
  };

  return (
    <form onSubmit={handleReview} noValidate className="flex flex-col gap-4">
      {stage.kind === "sent" ? (
        <p
          role={stage.tone === "error" ? "alert" : "status"}
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (stage.tone === "error" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary")
          }
        >
          {stage.message}
        </p>
      ) : null}

      <SelectField
        id="booking-dog"
        label="Dog"
        value={values.dogId}
        onChange={(event) => update("dogId", event.target.value)}
        error={errors.dogId}
      >
        {dogs.map((dog) => (
          <option key={dog.id} value={dog.id}>
            {dog.name}
          </option>
        ))}
      </SelectField>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-foreground">Start time</legend>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="booking-date"
            label="Date"
            type="date"
            value={values.date}
            onChange={(event) => update("date", event.target.value)}
            {...startAtA11y}
          />
          <TextField
            id="booking-time"
            label="Time"
            type="time"
            step={900}
            value={values.time}
            onChange={(event) => update("time", event.target.value)}
            {...startAtA11y}
          />
        </div>
        {errors.startAt ? (
          <p id="booking-start-error" className="text-sm font-medium text-danger">
            {errors.startAt}
          </p>
        ) : (
          <p id="booking-start-hint" className="text-sm text-muted">
            Between 1 hour and 60 days from now, in your local time.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-foreground">Duration</legend>
        <div className="grid grid-cols-3 gap-2">
          {WALK_DURATIONS_MINUTES.map((minutes) => (
            <label
              key={minutes}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-foreground has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
            >
              <input
                type="radio"
                name="durationMinutes"
                value={String(minutes)}
                checked={values.durationMinutes === String(minutes)}
                onChange={(event) => update("durationMinutes", event.target.value)}
                className="sr-only"
              />
              {minutes} min
            </label>
          ))}
        </div>
        {errors.durationMinutes ? (
          <p className="mt-1.5 text-sm font-medium text-danger">{errors.durationMinutes}</p>
        ) : null}
      </fieldset>

      <TextAreaField
        id="booking-notes"
        label="Pickup notes (optional)"
        rows={3}
        maxLength={500}
        placeholder="Gate code, where the leash is, anything the walker should know"
        value={values.pickupNotes}
        onChange={(event) => update("pickupNotes", event.target.value)}
        error={errors.pickupNotes}
      />

      <Button type="submit">Review request</Button>
    </form>
  );
}
