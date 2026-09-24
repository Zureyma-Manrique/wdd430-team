import Link from "next/link";
import { PRIMARY_NAV } from "./nav-items";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-sm">
          <p className="font-bold text-foreground">Paws &amp; Paths</p>
          <p className="mt-1 text-sm text-muted">
            Trusted local dog walkers, verified by reviews from real completed walks.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            {PRIMARY_NAV.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center rounded text-sm text-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center rounded text-sm text-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Paws &amp; Paths. A BYU WDD 430 team project.
      </p>
    </footer>
  );
}
