import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DogProfileCard } from "@/components/dogs/dog-profile-card";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getDogsForOwner } from "@/lib/data/dogs";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "My dogs",
  description: "The dogs on your account: add a new one, update their care notes, or remove one.",
  path: "/dogs",
  private: true,
});

/** Story B1: the owner's dogs. Signed-out visitors and walkers never see this list. */
export default async function DogsPage() {
  // Deny by default: `proxy.ts` also guards /dogs, but pages never rely on it alone.
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/dogs")}`);
  }
  if (session.role !== "OWNER") {
    redirect("/dashboard");
  }

  // Scoped by the session's own profile id, never an id from the URL (FR-004).
  const dogs = await getDogsForOwner(session.profileId);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Owner</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">My dogs</h1>
        </div>
        <ButtonLink href="/dogs/new">Add a dog</ButtonLink>
      </header>

      {dogs.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dogs.map((dog) => (
            <li key={dog.id}>
              <DogProfileCard dog={dog} editHref={`/dogs/${dog.id}`} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-lg font-semibold text-foreground">No dogs yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Add your dog once, with breed, size and care notes, and every walker you book will know them before the
            first walk.
          </p>
          <ButtonLink href="/dogs/new" className="mt-6">
            Add your first dog
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
