"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { focusRing } from "@/components/ui/styles";
import { PRIMARY_NAV } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Client leaf: needs `usePathname` to mark the current page with `aria-current`. */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
      {PRIMARY_NAV.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors " +
                `${focusRing} ` +
                (active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground")
              }
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
