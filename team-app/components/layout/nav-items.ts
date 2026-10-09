/** Shared by the server `Footer` and the client `NavLinks`, so it must stay a plain module. */
export const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/walkers", label: "Find a walker" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

/** For anyone signed in: the walks they booked (owner) or were asked to do (walker). */
export const SIGNED_IN_NAV = [{ href: "/walks", label: "My walks" }] as const;

/** Extra link for owners only (story B1). A walker has no dogs to manage. */
export const OWNER_NAV = [{ href: "/dogs", label: "My dogs" }] as const;
