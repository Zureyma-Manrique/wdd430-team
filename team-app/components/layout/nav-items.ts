/** Shared by the server `Footer` and the client `NavLinks`, so it must stay a plain module. */
export const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/walkers", label: "Find a walker" },
  { href: "/dashboard", label: "Dashboard" },
] as const;
