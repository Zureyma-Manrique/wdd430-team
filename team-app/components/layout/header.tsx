import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { focusRing } from "@/components/ui/styles";
import { NavLinks } from "./nav-links";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={`flex min-h-11 items-center gap-2 rounded-lg text-lg font-bold tracking-tight text-foreground ${focusRing}`}
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
          <div className="flex min-w-0 items-center gap-3">
            <p className="min-w-0 text-sm text-muted">
              Signed in as <span className="font-semibold break-words text-foreground">{session.name}</span>
            </p>
            <form action={signOutAction} className="shrink-0">
              <Button type="submit" variant="secondary" className="whitespace-nowrap">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ButtonLink href="/sign-up" variant="ghost">
              Sign up
            </ButtonLink>
            <ButtonLink href="/sign-in" variant="primary">
              Sign in
            </ButtonLink>
          </div>
        )}
      </div>
    </header>
  );
}
