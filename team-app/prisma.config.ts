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
    // Migrations need a direct (non-pooled) connection on hosts such as Neon, so DIRECT_URL wins
    // when it's set. The app itself connects with DATABASE_URL (lib/db.ts).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
