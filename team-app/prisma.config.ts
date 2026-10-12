import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI doesn't read Next's `.env.local`, so load it here. Hosts such as Vercel set real
// environment variables, which `dotenv` never overrides.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npx prisma db seed` (also `npm run db:seed`). Idempotent, see prisma/seed.ts.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection on hosts such as Neon, so a direct URL wins
    // when there is one. The names after DIRECT_URL are the ones Vercel's Neon integration creates.
    // The app itself connects with DATABASE_URL (lib/db.ts).
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      "",
  },
});
