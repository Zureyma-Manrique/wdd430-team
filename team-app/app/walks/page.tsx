import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WalkCard } from "@/components/walks/walk-card";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getPastWalks, getUpcomingWalks } from "@/lib/data/walks";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "My walks",
  description: "Your upcoming and past dog walks, with their status.",
  path: "/walks",
  private: true,
});

/** Stories C3 to C5: an owner's booked walks, or the walks assigned to a walker. */
export default async function WalksPage() {
  // Deny by default: `proxy.ts` also guards /walks, but pages never rely on it alone.
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/walks")}`);
  }

  // Both lists are scoped to the session's own profile id, never an id from the URL (FR-004).
  const [upcoming, past] = await Promise.all([getUpcomingWalks(session, 50), getPastWalks(session, 20)]);
  const now = new Date();
  const isOwner = session.role === "OWNER";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {isOwner ? "Owner" : "Walker"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">My walks</h1>
        </div>
        {isOwner ? <ButtonLink href="/walkers">Book a walk</ButtonLink> : null}
      </header>

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
        <h2 id="upcoming-heading" className="text-xl font-semibold text-foreground">
          Upcoming
        </h2>
        {upcoming.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {upcoming.map((walk) => (
              <li key={walk.id}>
                <WalkCard walk={walk} viewerRole={session.role} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No upcoming walks</p>
            <p className="mt-1 text-sm text-muted">
              {isOwner
                ? "Find a walker near you and request a time."
                : "New requests from owners will show up here for you to accept or decline."}
            </p>
            {isOwner ? (
              <ButtonLink href="/walkers" className="mt-4">
                Find a walker
              </ButtonLink>
            ) : null}
          </div>
        )}
      </section>

      <section aria-labelledby="past-heading" className="flex flex-col gap-4">
        <h2 id="past-heading" className="text-xl font-semibold text-foreground">
          Past
        </h2>
        {past.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {past.map((walk) => (
              <li key={walk.id}>
                <WalkCard walk={walk} viewerRole={session.role} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Finished, declined and cancelled walks will appear here.</p>
        )}
      </section>
    </div>
  );
}
