import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DogProfileCard } from "@/components/dogs/dog-profile-card";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getDogsForOwner } from "@/lib/data/dogs";
import { getWalkerById } from "@/lib/data/walkers";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // Deny by default: no session → sign in, then come back here (story A1, scenario 5).
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  // Data is always scoped to the session's own profile id, never an id from the URL.
  const dogs = session.role === "OWNER" ? await getDogsForOwner(session.profileId) : [];
  // `getWalkerById` only returns searchable walkers, so `null` means the profile still needs a
  // rate and service area before the walker shows up in search (story A1, scenario 2).
  const walkerProfileIncomplete = session.role === "WALKER" && (await getWalkerById(session.profileId)) === null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {session.role === "OWNER" ? "Owner dashboard" : "Walker dashboard"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Hi, {session.name}</h1>
      </header>

      {walkerProfileIncomplete ? (
        <section
          aria-labelledby="complete-profile-heading"
          className="rounded-xl border border-accent bg-accent-soft p-6"
        >
          <h2 id="complete-profile-heading" className="text-xl font-semibold text-foreground">
            Complete your walker profile
          </h2>
          <p className="mt-2 text-muted">
            Add your hourly rate and the postal codes you serve so owners can find you in search.
          </p>
          <ButtonLink href="/profile" className="mt-4">
            Complete profile
          </ButtonLink>
        </section>
      ) : null}

      {session.role === "OWNER" ? (
        <section aria-labelledby="dogs-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="dogs-heading" className="text-xl font-semibold text-foreground">
              Your dogs
            </h2>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/profile" variant="ghost">
                Edit profile
              </ButtonLink>
              <ButtonLink href="/walkers" variant="secondary">
                Book a walk
              </ButtonLink>
            </div>
          </div>
          {dogs.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dogs.map((dog) => (
                <li key={dog.id}>
                  <DogProfileCard dog={dog} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">You haven&apos;t added any dogs yet.</p>
          )}
        </section>
      ) : (
        <section aria-labelledby="requests-heading" className="rounded-xl border border-dashed border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="requests-heading" className="text-xl font-semibold text-foreground">
              Walk requests
            </h2>
            {walkerProfileIncomplete ? null : (
              <ButtonLink href="/profile" variant="secondary">
                Edit profile
              </ButtonLink>
            )}
          </div>
          <p className="mt-2 text-muted">
            Incoming requests and today&apos;s walks will appear here once scheduling ships (feature/schedule-api).
          </p>
        </section>
      )}
    </div>
  );
}
