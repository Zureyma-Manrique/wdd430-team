import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/*
 * The one Prisma client for the app (spec §5: PostgreSQL 16 + Prisma). Only `lib/data/*` imports
 * this file; pages and Route Handlers go through the query functions there.
 *
 * Kept on `globalThis` so dev hot reloads reuse one connection pool instead of opening a new one
 * on every edit. Created lazily, so `next build` doesn't need a database for pages that don't
 * query one.
 */

const globalForPrisma = globalThis as typeof globalThis & { __pawsPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Fails loudly and early. Never include the connection string itself in the message.
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in (see README).");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export function db(): PrismaClient {
  return (globalForPrisma.__pawsPrisma ??= createClient());
}
