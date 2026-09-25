import type { Metadata } from "next";
import { FilterBar } from "@/components/walkers/filter-bar";
import { WalkerCard } from "@/components/walkers/walker-card";
import { searchWalkers } from "@/lib/data/walkers";
import { walkerSearchParamsSchema, type WalkerSearchParams } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Find a walker",
  description: "Browse trusted local dog walkers by postal code, rating, and price.",
};

const DEFAULT_FILTERS: WalkerSearchParams = { sort: "rating" };

export default async function WalkersPage({ searchParams }: PageProps<"/walkers">) {
  // Untrusted query string → validated filters. Invalid input falls back to defaults.
  const parsed = walkerSearchParamsSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : DEFAULT_FILTERS;
  const walkers = await searchWalkers(filters);

  const initial = {
    postalCode: filters.postalCode ?? "",
    minRating: filters.minRating !== undefined ? String(filters.minRating) : "",
    sort: filters.sort,
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Find a walker</h1>
        <p className="max-w-2xl text-muted">
          Only active walkers with a complete profile are listed. Ratings come from completed walks.
        </p>
      </header>

      <FilterBar key={JSON.stringify(initial)} initial={initial} />

      {!parsed.success ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          Some filters in the address weren&apos;t valid, so we&apos;re showing all walkers instead.
        </p>
      ) : null}

      <section aria-labelledby="results-heading" className="flex flex-col gap-4">
        <h2 id="results-heading" className="text-sm font-medium text-muted" aria-live="polite">
          {walkers.length} {walkers.length === 1 ? "walker" : "walkers"} found
          {filters.postalCode ? ` in ${filters.postalCode}` : ""}
        </h2>

        {walkers.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {walkers.map((walker) => (
              <li key={walker.id}>
                <WalkerCard walker={walker} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="text-lg font-semibold text-foreground">No walkers match these filters</p>
            <p className="mt-2 text-sm text-muted">
              Try a nearby postal code or lower the minimum rating to widen your search.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
