export default function DogsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your dogs…
      </p>
      <div className="h-10 w-48 animate-pulse rounded-lg bg-surface-muted" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <li key={item} className="h-40 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </ul>
    </div>
  );
}
