import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WalkCard } from "@/components/walks/walk-card";
import { WalkStatusPoller } from "@/components/walks/walk-status-poller";
import { LocalDateTime } from "@/components/walks/local-date-time";
import { textLinkClasses } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { getWalkForActor } from "@/lib/data/walks";
import { pageMetadata } from "@/lib/metadata";
import { idParamsSchema } from "@/lib/validation";

export const metadata: Metadata = pageMetadata({
  title: "Walk details",
  description: "The status of one dog walk, updated while it is under way.",
  path: "/walks",
  private: true,
});

/**
 * Story C6: one walk, kept fresh while it is under way. Lives outside the `(list)` route group, so
 * a missing walk is a real `404` and not a soft one behind a loading skeleton.
 */
export default async function WalkDetailPage({ params }: PageProps<"/walks/[id]">) {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/walks/${parsed.data.id}`)}`);
  }
  // Scoped to the signed-in person: someone else's walk is a 404 (FR-004).
  const walk = await getWalkForActor(session, parsed.data.id);
  if (!walk) notFound();
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/walks" className={`w-fit ${textLinkClasses}`}>
        ← My walks
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Walk details</h1>
      <WalkCard walk={walk} viewerRole={session.role} now={now} showDetailsLink={false} />
      {walk.actualStartAt || walk.actualEndAt ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
          {walk.actualStartAt ? (
            <>
              <dt className="text-muted">Started</dt>
              <dd className="font-medium text-foreground">
                <LocalDateTime iso={walk.actualStartAt} />
              </dd>
            </>
          ) : null}
          {walk.actualEndAt ? (
            <>
              <dt className="text-muted">Finished</dt>
              <dd className="font-medium text-foreground">
                <LocalDateTime iso={walk.actualEndAt} />
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}
      <WalkStatusPoller walkId={walk.id} status={walk.status} />
    </div>
  );
}
