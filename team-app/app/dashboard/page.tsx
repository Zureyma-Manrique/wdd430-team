import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DogProfileCard } from "@/components/dogs/dog-profile-card";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getDogsForOwner } from "@/lib/data/dogs";
import { getOwnWalkerProfile } from "@/lib/data/walkers";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Dashboard",
  description: "Your dogs, walk requests, and upcoming walks in one place.",
  path: "/dashboard",
  private: true,
});

export default async function DashboardPage() {
  // Deny by default: no session → sign in, then come back here (story A1, scenario 5).
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  // Data is always scoped to the session's own profile id, never an id from the URL.
  const dogs = session.role === "OWNER" ? await getDogsForOwner(session.profileId) : [];
  // Two different reasons a walker is missing from search (FR-041): the profile still needs a
  // rate and service area (story A1, scenario 2), or the walker turned off "Accepting new walks".
  const ownWalker = session.role === "WALKER" ? await getOwnWalkerProfile(session.profileId) : null;
  const walkerProfileIncomplete =
    ownWalker !== null && (ownWalker.hourlyRate === null || ownWalker.serviceAreaPostalCodes.length === 0);
  const walkerPaused = ownWalker !== null && !walkerProfileIncomplete && !ownWalker.isActive;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {session.role === "OWNER" ? "Owner dashboard" : "Walker dashboard"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hi, {session.name}</h1>
        </div>
        {/* About the account, not the dogs or walks, so it sits with the greeting (story A3). */}
        {walkerProfileIncomplete ? null : (
          <ButtonLink href="/profile" variant="secondary">
            Edit profile
          </ButtonLink>
        )}
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

      {walkerPaused ? (
        <section aria-labelledby="paused-profile-heading" className="rounded-xl border border-border bg-surface-muted p-6">
          <h2 id="paused-profile-heading" className="text-xl font-semibold text-foreground">
            You&apos;re hidden from search
          </h2>
          <p className="mt-2 text-muted">
            &ldquo;Accepting new walks&rdquo; is off, so owners can&apos;t find you. Turn it back on in your profile
            when you&apos;re ready for new requests.
          </p>
        </section>
      ) : null}

      {session.role === "OWNER" ? (
        <section aria-labelledby="dogs-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="dogs-heading" className="text-xl font-semibold text-foreground">
              Your dogs
            </h2>
            <ButtonLink href="/walkers" variant="secondary">
              Book a walk
            </ButtonLink>
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
          <h2 id="requests-heading" className="text-xl font-semibold text-foreground">
            Walk requests
          </h2>
          <p className="mt-2 text-muted">
            Incoming requests and today&apos;s walks will appear here once scheduling ships (feature/schedule-api).
          </p>
        </section>
      )}
    </div>
  );
}
