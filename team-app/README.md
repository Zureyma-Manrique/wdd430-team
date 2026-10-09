# Paws & Paths

**Trusted local dog walkers.** Paws & Paths connects dog owners with dog walkers in their area. Owners keep a profile for each dog, find a walker by postal code, rating and price, and request a walk. Walkers build a public profile, accept or decline requests, and run the walk. Ratings and reviews on a walker's page belong to completed walks.

- **Live app:** _add the Vercel URL here after deploying (see [Deploying](#deploying))_
- **Repository:** https://github.com/Zureyma-Manrique/wdd430-team
- **Course:** BYU–Pathway WDD 430, Web Full-Stack Development (team project)

## Team

| Member | GitHub | Role |
| --- | --- | --- |
| Zureyma Manrique | [@Zureyma-Manrique](https://github.com/Zureyma-Manrique) | Project lead and developer. This is a one-person team, so every branch, pull request and review is hers. |

## Who it is for and what problem it solves

Dog owners who work long days or travel have no easy way to find a walker they can trust, and walkers have no easy way to get steady local clients. Paws & Paths gives both sides one place: owners describe their dogs once, walkers describe their service area and rate, and a request-and-confirm flow keeps everyone's schedule clear. A walker can never be double-booked, and every review is tied to a walk that was actually completed.

## Features

| Area | What works |
| --- | --- |
| Accounts | Sign up as an **Owner** or a **Walker**, sign in, sign out. Protected pages redirect signed-out visitors to sign-in and back. |
| Walker profile | Bio, service-area postal codes, hourly rate, photo link, and an "Accepting new walks" switch. Only complete, active profiles appear in search. |
| Owner profile | Name, phone, neighborhood postal code. |
| **Dogs (CRUD)** | Owners add, edit and remove dogs. Removing archives the dog, so past walks and reviews keep their record. |
| Find a walker | Search by postal code, sort by rating or price, filter by minimum rating. Public walker pages show ratings and reviews. |
| **Walks (booking)** | Owners request a walk for a dog; walkers accept, decline, start and complete it; either side can cancel. A walker can't be double-booked, which the database itself enforces. |
| Quality | Responsive from 360 px up, light and dark themes, WCAG AAA text contrast, loading / empty / error states, page metadata and a generated share image. |

There are 11 pages: Home, Find a walker, Walker profile, Sign in, Sign up, Dashboard, Profile, My dogs, Add a dog, Edit a dog and My walks.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) and React 19. Server Components by default; client components only for interactive forms and buttons. |
| Language | TypeScript 5 (`strict`, no `any`) |
| Database | PostgreSQL 16 with Prisma 7 (`prisma/schema.prisma`, migrations in `prisma/migrations`) |
| Auth | Auth.js v5 (`next-auth@beta`) with a Credentials provider, bcrypt password hashes and JWT sessions |
| Validation | Zod 4 schemas in `lib/validation`, shared by forms and Route Handlers |
| Styling | Tailwind CSS v4 with design tokens in `app/globals.css` |
| Quality | ESLint, Prettier |
| Hosting | Vercel + a managed Postgres database (Neon) |

### How a request flows (client → Route Handler → database)

```
DogForm (client component)  →  POST /api/dogs (Route Handler)  →  createDog() (lib/data)  →  Prisma  →  PostgreSQL
   validates with Zod            session → role → Zod → owner scope   typed query, owner id        row saved
```

Every Route Handler checks, in order: signed in (`401`), role (`403`), valid input (`400`), then that the record belongs to the signed-in person (`404`, so nobody can tell whether someone else's record exists). The acting user's id comes only from the session, never from the request.

## Getting started (local)

You need Node.js 20 or newer and a PostgreSQL 16 database.

```bash
cd team-app
npm install                     # also generates the Prisma client
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your Postgres connection string, e.g. `postgresql://postgres:postgres@localhost:5432/paws_and_paths` |
| `AUTH_SECRET` | Run `npx auth secret`, or paste the output of `openssl rand -base64 32` |

Then create the tables, load the demo data and start the app:

```bash
npm run db:migrate              # creates the tables (use db:deploy to apply existing migrations only)
npm run db:seed                 # demo walkers, owners, dogs and reviews (safe to run again)
npm run dev                     # http://localhost:3000
```

No Postgres installed? Run one with Docker: `docker run --name paws-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=paws_and_paths -p 5432:5432 -d postgres:16`.

To try a production build locally (`npm run build && npm start`) also set `AUTH_TRUST_HOST=true`. Auth.js trusts the host automatically only in development and on Vercel.

### Demo accounts

Password for both: `paws-demo-2026`

| Role | Email | Try this |
| --- | --- | --- |
| Owner | `jordan@example.com` | Has two dogs. Find a walker, request a walk, add or edit a dog. |
| Walker | `sam@example.com` | Has a complete profile, reviews and incoming requests. Accept or decline a request. |

You can also create your own account at `/sign-up`. The other seeded people (Mia, Theo, Ana, Riley and the review authors) exist so search and reviews have content; they can't be signed in to.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development server, production build, production server |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier |
| `npm run db:migrate` | Create and apply a migration from `schema.prisma` (development) |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:seed` | Load the demo data (idempotent) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Deploying

The app runs on Vercel with a Neon Postgres database. The first deploy takes about ten minutes.

1. **Create the database.** In [Neon](https://neon.tech) create a project. From its dashboard copy two connection strings: the **pooled** one (host contains `-pooler`) and the **direct** one.
2. **Import the repository in Vercel** ([vercel.com/new](https://vercel.com/new)). Set **Root Directory** to `team-app`. Vercel detects Next.js and runs the `vercel-build` script, which applies migrations, seeds the demo data **only if the database is empty**, and builds the app.
3. **Add environment variables** (Project → Settings → Environment Variables):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** connection string. The app uses this. |
   | `DIRECT_URL` | Neon **direct** connection string. Migrations use this. |
   | `AUTH_SECRET` | A long random string (`npx auth secret`) |
   | `SITE_URL` | Optional. The public `https://…` address. Vercel's own domain is used if you leave it out. |

   `AUTH_TRUST_HOST` is not needed on Vercel.
4. **Deploy.** Open the deployment URL and sign in with a demo account. Put the URL at the top of this file.

Redeploying never touches existing data: migrations only add what is missing, and the seed does nothing once any user exists.

If a deploy fails on `CREATE EXTENSION btree_gist`, your host doesn't allow that extension. Neon and Supabase do. The extension powers the no-double-booking rule (migration `20261009061716_walk_end_at_and_overlap`).

## API

All endpoints are Route Handlers under `app/api/`. Bodies are JSON and validated with Zod; unknown fields are rejected. Errors always look like:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields", "details": { "fieldErrors": { "name": ["Enter a name"] } } } }
```

Status codes: `200` OK · `201` created · `204` no content · `400` invalid input · `401` not signed in · `403` wrong role · `404` not found **or not yours** · `409` conflict with the current state.

### Accounts and profiles

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | `{ name, email, password, role }`. Password is 8 to 72 characters. `409` if the email is taken. |
| `GET` `POST` | `/api/auth/[...nextauth]` | Public | Auth.js: sign in, sign out, session. |
| `GET` | `/api/owners/me` | Owner | `{ owner: { id, name, phone, postalCode } }` |
| `PATCH` | `/api/owners/me` | Owner | `{ name?, phone?, postalCode? }`. `null` clears phone or postal code. |
| `GET` | `/api/walkers/[id]` | Public | Public profile with `averageRating` and `reviewCount`. `404` if inactive or incomplete. |
| `GET` | `/api/walkers/me` | Walker | My profile, complete or not. |
| `PATCH` | `/api/walkers/me` | Walker | `{ bio?, serviceAreaPostalCodes?, hourlyRate?, photoUrl?, isActive? }` |

### Dogs

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/dogs` | Owner | My dogs (archived ones are left out). |
| `POST` | `/api/dogs` | Owner | `{ name, size, breed?, birthDate?, weightKg?, notes?, photoUrl? }` → `201`. `size` is `SMALL`, `MEDIUM`, `LARGE` or `XLARGE`. |
| `GET` | `/api/dogs/[id]` | Owner (owns) | One of my dogs. |
| `PATCH` | `/api/dogs/[id]` | Owner (owns) | Any of the create fields. `null` or `""` clears an optional one. |
| `DELETE` | `/api/dogs/[id]` | Owner (owns) | Archives the dog → `204`. `409` while the dog has a pending, confirmed or in-progress walk. |

### Walks

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/walks` | Owner or walker | My walks. Query: `status` (comma-separated), `dogId`, `from`, `to` (dates in `tz`), `tz` (IANA zone), `page`, `pageSize`. |
| `POST` | `/api/walks` | Owner | `{ dogId, walkerId, startAt, durationMinutes, pickupNotes? }` → `201`, status `PENDING`. `startAt` is ISO 8601 with an offset, 1 hour to 60 days ahead; `durationMinutes` is 30, 45 or 60. `409 WALKER_UNAVAILABLE` if it overlaps another active walk of that walker. |
| `POST` | `/api/walks/[id]/status` | Owner or walker | `{ action, reason?, sessionNotes? }`. See the table below. |

Allowed status changes (anything else is `409`; the wrong role is `403`):

| Action | From → to | Who |
| --- | --- | --- |
| `accept` | `PENDING` → `CONFIRMED` | Walker |
| `decline` | `PENDING` → `DECLINED` | Walker |
| `cancel` | `PENDING` or `CONFIRMED` → `CANCELLED` | Owner or walker |
| `start` | `CONFIRMED` → `IN_PROGRESS` (from 15 minutes before the start time) | Walker |
| `complete` | `IN_PROGRESS` → `COMPLETED` | Walker |

## Project layout

```
team-app/
  app/                    Pages and Route Handlers (App Router)
    api/                  auth, owners, walkers, dogs, walks
    dogs/ walks/ …        My dogs and My walks pages, each with loading and error states
    robots.ts sitemap.ts opengraph-image.tsx
  components/             ui (button, form fields, notices), layout, auth, dogs, walkers, walks, profile
  lib/
    data/                 The only code that talks to the database (typed Prisma queries)
    validation/           Zod schemas shared by forms and Route Handlers
    auth/ api/ walks/     Session helper, guards and error format, walk status rules
    db.ts metadata.ts     Prisma client, shared page metadata
  prisma/                 schema.prisma, migrations, seed.ts
  proxy.ts                Redirects signed-out visitors away from signed-in pages
```

`CLAUDE.md` (and the repository's `specs/` folder) describe the conventions in more detail.

## Quality evidence

**Lighthouse** (mobile emulation, incognito, production build, run from the repository's own server):

| Page | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Home | 99 | 100 | 100 | 100 |
| Find a walker | 95 | 100 | 100 | 100 |
| Walker profile | 98 | 100 | 100 | 100 |
| Sign in | 96 | 100 | 100 | 100 |
| Sign up | 96 | 100 | 100 | 100 |

Strongest category: Accessibility, Best Practices and SEO are all 100. Weakest: Performance (95 to 99). First paint is under 0.8 seconds; the largest contentful paint (a block of text) lands at about 2 to 3 seconds under Lighthouse's simulated slow 4G. Pages that need a sign-in are intentionally `noindex`, so a Lighthouse run while signed in shows 66 for SEO there; signed out they redirect to sign-in, which scores 100.

**Color contrast:** every text color pair is at least 7:1 (WCAG AAA) in both the light and dark themes. An axe-core run (WCAG 2 A, AA, AAA and best-practice rules) over all 14 page states in both themes found no violations.

**Manual testing:** each flow was exercised in a real browser against a real PostgreSQL database, including the database rules: three simultaneous sign-ups with one email produce one account, and five simultaneous bookings of one time slot produce one booking.

## Known issues and opportunities

- **Google sign-in is not built** (the spec lists it; tracked in issue #32). Only email and password work.
- **No automated tests or CI yet** (issue #34). Everything above was verified by hand.
- **Sessions are JWTs, not database sessions.** Auth.js supports its Credentials provider only with JWT sessions. Accounts live in Postgres, and the account is re-read on every request, so a deleted account is signed out immediately.
- **Reviews are read-only.** Walker pages show seeded reviews and ratings; writing, editing and replying to reviews (stories D1, D3, D4) are not built.
- **Requests never expire on their own.** A pending request whose time has passed just moves to "Past".
- **Deactivating a walker doesn't cancel their upcoming walks** (issue #35).
- **No live walk-status page.** Walkers can start and complete a walk, but there is no polling status page for owners (story C6).
- **No password reset, email verification or sign-in rate limiting.** Worth adding before real users.
- **Photos are links, not uploads.** An upload service (for example Vercel Blob) would be a natural next step.
- Opportunities: walker availability calendars, in-app messages between owner and walker, pagination on the walker search, and a dark-theme share image.
