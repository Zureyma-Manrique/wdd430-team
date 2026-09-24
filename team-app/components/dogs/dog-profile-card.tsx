import type { DogProfile } from "@/lib/types";
import { formatDogSize, initials } from "@/lib/format";

interface DogProfileCardProps {
  dog: DogProfile;
}

/** Dog ("pet") card: name, breed, size, photo placeholder, and care notes (story B1). */
export function DogProfileCard({ dog }: DogProfileCardProps) {
  const headingId = `dog-${dog.id}-name`;

  return (
    <article aria-labelledby={headingId} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-base font-bold text-accent"
        >
          {initials(dog.name)}
        </span>
        <div className="min-w-0">
          <h3 id={headingId} className="truncate text-lg font-semibold text-foreground">
            {dog.name}
          </h3>
          <p className="text-sm text-muted">{dog.breed ?? "Breed not set"}</p>
        </div>
        <span className="ml-auto rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">
          {formatDogSize(dog.size)}
        </span>
      </div>

      {dog.notes ? (
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">
          <span className="font-medium">Care notes:</span> {dog.notes}
        </p>
      ) : null}
    </article>
  );
}
