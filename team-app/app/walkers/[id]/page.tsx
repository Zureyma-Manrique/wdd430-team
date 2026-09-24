import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { BookingForm } from "@/components/walkers/booking-form";
import { RatingBadge } from "@/components/walkers/rating-badge";
import { WalkerAvatar } from "@/components/walkers/walker-avatar";
import { getSession } from "@/lib/auth/session";
import { getDogsForOwner } from "@/lib/data/dogs";
import { getWalkerById, getWalkerReviews } from "@/lib/data/walkers";
import { formatDateUtc, formatHourlyRate } from "@/lib/format";
import { idParamsSchema } from "@/lib/validation";

const REVIEWS_PAGE_SIZE = 10;

/** `?reviewPage=N` drives "Load more". Capped at 5 pages (50 reviews) per NFR-001. */
const reviewPageSchema = z.object({
  reviewPage: z.coerce.number().int().min(1).max(5).catch(1),
});

async function loadWalker(params: Promise<{ id: string }>) {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const walker = await getWalkerById(parsed.data.id);
  if (!walker) notFound();
  return walker;
}

export async function generateMetadata({ params }: PageProps<"/walkers/[id]">): Promise<Metadata> {
  const walker = await loadWalker(params);
  return {
    title: walker.displayName,
    description: walker.bio ?? `Book a dog walk with ${walker.displayName}.`,
  };
}

export default async function WalkerProfilePage({ params, searchParams }: PageProps<"/walkers/[id]">) {
  const walker = await loadWalker(params);
  const { reviewPage } = reviewPageSchema.parse(await searchParams);
  const [{ reviews, total }, session] = await Promise.all([
    getWalkerReviews(walker.id, reviewPage * REVIEWS_PAGE_SIZE),
    getSession(),
  ]);
  const dogs = session?.role === "OWNER" ? await getDogsForOwner(session.profileId) : [];
  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(`/walkers/${walker.id}`)}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
      <div className="flex flex-col gap-8">
        <Link
          href="/walkers"
          className="w-fit rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          ← All walkers
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <WalkerAvatar name={walker.displayName} size="lg" />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{walker.displayName}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <RatingBadge averageRating={walker.averageRating} reviewCount={walker.reviewCount} />
              {walker.hourlyRate !== null ? (
                <span className="text-lg font-bold text-foreground">{formatHourlyRate(walker.hourlyRate)}</span>
              ) : null}
            </div>
          </div>
        </header>

        <section aria-labelledby="about-heading" className="flex flex-col gap-3">
          <h2 id="about-heading" className="text-xl font-semibold text-foreground">
            About
          </h2>
          {/* User-generated text is rendered as a React text node, so it is always escaped. */}
          <p className="whitespace-pre-line text-foreground">{walker.bio ?? "This walker hasn't written a bio yet."}</p>
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground">Service area:</span>{" "}
            {walker.serviceAreaPostalCodes.join(", ")}
          </p>
        </section>

        <section id="reviews" aria-labelledby="reviews-heading" className="flex flex-col gap-4">
          <h2 id="reviews-heading" className="text-xl font-semibold text-foreground">
            Reviews {total > 0 ? <span className="text-muted">({total})</span> : null}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      <span aria-hidden="true" className="text-accent">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <span className="sr-only">Rated {review.rating} out of 5</span>
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateUtc(review.createdAt)}
                      {review.editedAt ? " · Edited" : ""}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {review.authorFirstName} with {review.dogName}
                  </p>
                  {review.comment ? <p className="mt-3 text-foreground">{review.comment}</p> : null}
                  {review.walkerReply ? (
                    <div className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">Reply from {walker.displayName}</p>
                      <p className="mt-1 text-foreground">{review.walkerReply}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {reviews.length < total && reviewPage < 5 ? (
            <Link
              href={`/walkers/${walker.id}?reviewPage=${reviewPage + 1}#reviews`}
              scroll={false}
              className={buttonClasses("secondary", "w-fit")}
            >
              Load more reviews
            </Link>
          ) : null}
        </section>
      </div>

      <aside aria-labelledby="booking-heading" className="lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 id="booking-heading" className="text-xl font-semibold text-foreground">
            Book a walk
          </h2>
          {session === null ? (
            <>
              <p className="text-sm text-muted">Sign in as an owner to request a walk with {walker.displayName}.</p>
              <ButtonLink href={signInHref}>Sign in to book</ButtonLink>
            </>
          ) : session.role === "OWNER" ? (
            <BookingForm
              walkerId={walker.id}
              walkerName={walker.displayName}
              dogs={dogs.map(({ id, name }) => ({ id, name }))}
            />
          ) : (
            <p className="text-sm text-muted">Walker accounts can&apos;t book walks. Sign in with an owner account.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
