import { ButtonLink } from "@/components/ui/button";
import { WalkerCard } from "@/components/walkers/walker-card";
import { searchWalkers } from "@/lib/data/walkers";

const SERVICES = [
  {
    icon: "🔎",
    title: "Find trusted walkers",
    body: "Search by postal code, compare hourly rates, and read reviews from owners whose walks were actually completed.",
  },
  {
    icon: "🐶",
    title: "Profiles for every dog",
    body: "Save breed, size, and care notes once, so every walker knows your dog is afraid of bikes before the first walk.",
  },
  {
    icon: "📍",
    title: "Live walk updates",
    body: "See when a walk starts and ends, read session notes from your walker, then rate the walk right away.",
  },
] as const;

const STEPS = [
  "Create a free owner account and add your dog.",
  "Pick a walker near you, then choose a date, time, and 30, 45, or 60 minutes.",
  "Your walker confirms. Follow the walk live and leave a review when it's done.",
] as const;

export default async function HomePage() {
  const featuredWalkers = (await searchWalkers({ sort: "rating" })).slice(0, 3);

  return (
    <>
      <section className="border-b border-border bg-primary-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dog walking, done right</p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Happy dogs, trusted walkers, one easy path.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Paws &amp; Paths connects busy owners with reliable local walkers, backed by verified reviews.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/walkers">Find a walker</ButtonLink>
            <ButtonLink href="/sign-in" variant="secondary">
              Become a walker
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="services-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 id="services-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Everything your dog needs from a walk
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {SERVICES.map((service) => (
            <li key={service.title} className="rounded-xl border border-border bg-surface p-6">
              <span aria-hidden="true" className="text-3xl">
                {service.icon}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm text-muted">{service.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-heading" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 id="steps-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <p className="pt-2 text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {featuredWalkers.length > 0 ? (
        <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="featured-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Top-rated walkers
            </h2>
            <ButtonLink href="/walkers" variant="ghost">
              See all walkers →
            </ButtonLink>
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredWalkers.map((walker) => (
              <li key={walker.id}>
                <WalkerCard walker={walker} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
