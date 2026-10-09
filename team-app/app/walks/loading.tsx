export default function WalksLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your walks…
      </p>
      <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-muted" />
      <ul className="mt-8 grid gap-4 md:grid-cols-2" aria-hidden="true">
        {[0, 1].map((item) => (
          <li key={item} className="h-36 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </ul>
    </div>
  );
}
