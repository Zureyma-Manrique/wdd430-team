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
