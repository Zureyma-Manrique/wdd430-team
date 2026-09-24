import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/button";
import { NavLinks } from "./nav-links";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-lg text-lg font-bold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            🐾
          </span>
          Paws &amp; Paths
        </Link>

        <nav aria-label="Primary" className="order-last w-full sm:order-none sm:w-auto">
          <NavLinks />
        </nav>

        {session ? (
          <p className="text-sm text-muted">
            Signed in as <span className="font-semibold text-foreground">{session.name}</span>
          </p>
        ) : (
          <ButtonLink href="/sign-in" variant="primary">
            Sign in
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
