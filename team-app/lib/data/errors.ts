import "server-only";

/*
 * Prisma reports constraint problems as errors with a `code`. These helpers narrow an `unknown`
 * error without importing Prisma's error classes (which differ between client builds).
 * https://www.prisma.io/docs/orm/reference/error-reference
 */

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

/** P2002: a UNIQUE constraint failed (for example a second account with the same email). */
export function isUniqueViolation(error: unknown): boolean {
  return hasCode(error, "P2002");
}

/** P2025: the record an update or delete targeted doesn't exist. */
export function isNotFound(error: unknown): boolean {
  return hasCode(error, "P2025");
}

/**
 * Postgres `23P01`: the "no overlapping walks for one walker" exclusion constraint rejected an
 * insert (FR-022). Prisma reports it as `P2039` with the driver's details in `meta`.
 */
export function isOverlapViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const meta = "meta" in error ? error.meta : undefined;
  const originalCode =
    typeof meta === "object" && meta !== null && "driverAdapterError" in meta
      ? (meta.driverAdapterError as { cause?: { originalCode?: unknown } } | null)?.cause?.originalCode
      : undefined;
  return originalCode === "23P01";
}
