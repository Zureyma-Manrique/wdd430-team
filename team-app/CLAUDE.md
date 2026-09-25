@AGENTS.md

# Paws & Paths: Project Guide for Claude

Paws & Paths connects dog owners with trusted local dog walkers. Owners store dog profiles, find
walkers, and book walks. Walkers accept requests and run walks. Owners review completed walks.

**Sources of truth, in priority order.** If this file disagrees with them, they win. Update this file.
1. `../.specify/memory/constitution.md`: non-negotiable engineering principles (I–VI)
2. `../specs/001-paws-and-paths/spec.md`: user stories, FR-xxx requirements, API contract
3. `../specs/001-paws-and-paths/checklists/requirements.md`

Cite requirement IDs (for example `FR-023` or story `C2`) in comments where code implements a rule.

## Tech stack

| Area | Choice |
|---|---|
| Framework | **Next.js 16 App Router**, React 19. Read `node_modules/next/dist/docs/` before using a framework API; this version differs from older training data (e.g. `params`/`searchParams` are Promises, `error.tsx` receives `retry`, `middleware` is now `proxy.ts`). |
| Language | TypeScript 5, `strict: true`. **No `any`** (ESLint error). Use `unknown` + narrowing. |
| Styling | Tailwind CSS v4 utilities only. Tokens live in `app/globals.css` (`@theme inline`). |
| Validation | Zod 4 (`z.email()`, `z.iso.datetime()`, `{ error: "..." }`, `z.flattenError`). |
| Data (planned) | PostgreSQL 16 + Prisma. Until then: in-memory seed data in `lib/data/seed.ts`. |
| Auth (planned) | Auth.js v5 (Prisma adapter, Credentials + Google). Until then: `lib/auth/session.ts` stub. |
| Testing (planned) | Vitest + React Testing Library, Playwright E2E. Do not add Jest or Cypress. |

Commands (run inside `team-app/`): `npm run dev`, `npm run build`, `npm run lint`, `npx tsc --noEmit`.

## Directory layout

```
app/                         Routes (App Router). Server Components by default.
  (auth)/sign-in/            Sign-in page (/login redirects here via next.config.ts)
  dashboard/                 Protected role dashboard
  walkers/(directory)/       Walker directory + its loading.tsx (route group, see note below)
  walkers/[id]/              Public walker profile & booking
  api/<resource>/route.ts    Route Handlers: all CRUD and server-side filtering
components/
  ui/                        Primitives: button.tsx, form-field.tsx, styles.ts (focusRing, textLinkClasses)
  layout/                    header.tsx, footer.tsx, nav-links.tsx (client), nav-items.ts
  walkers/                   walker-card, rating-badge, filter-bar (client), booking-form (client)
  dogs/                      dog-profile-card
  auth/                      sign-in-form (client)
lib/
  types/index.ts             Domain types + enum tuples (USER_ROLES, DOG_SIZES, WALK_BOOKING_STATUSES)
  validation/*.ts            Zod schemas shared by Route Handlers and client forms
  data/*.ts                  Server-only data access (`import "server-only"`)
  auth/session.ts            getSession(): the only way to read the current user
  api/http.ts                apiError(), readJsonBody()
  format.ts                  Display formatters
```

**Naming** (Constitution V): files and dirs `kebab-case`; components `PascalCase`; functions and
variables `camelCase`; types `PascalCase`. Use domain words: owner, walker, dog, walk, booking, review.

## Domain model (`lib/types`)

- `User` (id, email, name, `role: "OWNER" | "WALKER"`). One role per account.
- `PetOwner`: phone, postalCode. Owns `DogProfile`s and `WalkBooking`s.
- `Walker`: displayName, bio ≤500, serviceAreaPostalCodes (1–10), hourlyRate $5–$200, isActive.
  `WalkerSummary` adds computed `averageRating` (null if no reviews) and `reviewCount`.
- `DogProfile`: name 1–50, size `SMALL|MEDIUM|LARGE|XLARGE`, optional breed/birthDate/weightKg/notes. Soft-deleted with `archivedAt`.
- `WalkBooking`: startAt (UTC ISO), durationMinutes `30|45|60`, `WalkBookingStatus`, notes, cancellation.
- `WalkerReview`: one per COMPLETED walk, rating 1–5, comment ≤1000, walkerReply ≤500.

Status transitions (FR-023) are the only legal ones. Anything else returns `409`:
`PENDING→CONFIRMED|DECLINED` (walker) · `PENDING|CONFIRMED→CANCELLED` (owner or walker) ·
`CONFIRMED→IN_PROGRESS` (walker, ≥ start−15 min) · `IN_PROGRESS→COMPLETED` (walker) · `PENDING→EXPIRED` (system).

Add enum values to the `as const` tuples in `lib/types`. Zod schemas derive from them, so the two can't drift.

## Architecture rules

- **Server first.** Pages and layouts are Server Components. Add `'use client'` only to small
  interactive leaves (forms, filters, nav highlighting). Pass data down as serializable props.
- **Never import a non-component value from a `'use client'` file into a Server Component.** It
  becomes a client reference. Put shared constants in a plain module (see `nav-items.ts`).
- **Hydration safety:** no `Date.now()`, `new Date()`, `Math.random()`, `window`, or locale-dependent
  formatting during a client component's render. Do them in event handlers or effects. Server
  components format dates with an explicit locale + `timeZone` (`formatDateUtc`).
- Add `loading.tsx` / `error.tsx` to route segments that fetch data. `error.tsx` must be a client component and must not render `error.message`.
- **Soft-404 trap:** a `loading.tsx` above a page that calls `notFound()` streams a `200` before the
  404 is known. Put list-page skeletons in a route group (e.g. `walkers/(directory)/loading.tsx`)
  so detail routes like `walkers/[id]` still return real `404`s.
- Filters live in the URL query string. The page validates `searchParams` with Zod and falls back to defaults on invalid input.
- API errors use `{ error: { code, message, details? } }` via `apiError()` (spec §6).

## Visual design system

Tokens are defined in `app/globals.css` with light and dark values. **Never hard-code hex colors or
arbitrary color values in components.** If you need a new color, add a token.

| Token (utility) | Use |
|---|---|
| `bg-background` | Page background (warm off-white / deep green-black) |
| `bg-surface`, `bg-surface-muted` | Cards, panels / subtle fills, skeletons |
| `text-foreground`, `text-muted` | Body text / secondary text |
| `border-border` | All borders and dividers |
| `bg-primary`, `text-primary-foreground`, `hover:bg-primary-hover` | Primary actions (forest green, "paths") |
| `bg-primary-soft` + `text-primary` | Active nav, selected states, success notices |
| `bg-accent-soft` + `text-accent` | Ratings and stars (warm amber, "paws") |
| `bg-danger-soft` + `text-danger` | Errors and destructive states |

- **Typography:** Geist Sans (`font-sans`). Page `h1`: `text-3xl sm:text-4xl font-bold tracking-tight`.
  Section `h2`: `text-xl`–`text-3xl font-semibold|bold`. Body `text-base`, secondary `text-sm text-muted`.
- **Spacing and layout:** page container `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`, vertical rhythm
  `py-10`/`py-16`, stacks with `gap-4`/`gap-8`. Cards use `rounded-xl border border-border bg-surface p-5 shadow-sm`.
  Controls use `rounded-lg`.
- **Mobile first:** base styles target 360px. Add `sm:`, `md:`, `lg:` upward.
- **Accessibility (WCAG 2.1 AA):** every text pair ≥ 4.5:1. Interactive targets `min-h-11` (44px).
  Visible focus via the shared `focusRing` constant (`components/ui/styles.ts`); never re-type the classes.
  When a multi-step UI swaps content, move focus to the new heading or status (see `booking-form.tsx`).
  Status is never shown by color alone (badges contain text). Forms use `TextField`/`SelectField`/
  `TextAreaField`, which wire up `label`, `aria-invalid`, and `aria-describedby`. Emoji decoration is `aria-hidden`.
- Reuse `Button`/`ButtonLink`/`buttonClasses` rather than restyling buttons. Build one shared `WalkStatusBadge` for walk statuses.

## Security rules (mandatory)

1. **Secrets:** only in `.env.local` (gitignored by the root `.gitignore`: `.env*`, `!.env.example`).
   Document every new variable in `.env.example` with an empty/placeholder value. Never prefix a
   secret with `NEXT_PUBLIC_`. Server-only modules start with `import "server-only"`.
2. **Validate every trust boundary with Zod**: route `params`, `searchParams`, request bodies,
   and form input. Use `safeParse` and return `400` (API) or `notFound()` / defaults (pages).
   Use `z.strictObject` for mutation bodies so unexpected fields such as `ownerId` or `status` are rejected.
   In PATCH schemas use `clearableText()` (not `optionalText()`) so `""`/`null` can clear a field.
3. **AuthN/AuthZ on the server, every time.** In each Route Handler, run these checks in order: `getSession()` → `401`,
   role → `403`, validate → `400`, ownership → `404` (never reveal that another user's resource exists, FR-004).
   Take the acting user's id **only** from the session, never from the body, query, or URL.
   Hiding a button in the UI is not access control.
4. **XSS:** never use `dangerouslySetInnerHTML` (ESLint `react/no-danger` is an error). Render user
   text as React children. User-supplied URLs must pass `httpsUrlSchema` before they reach `href`/`src`.
5. **Injection:** Prisma query objects or `$queryRaw` tagged templates only. Never
   `$queryRawUnsafe` or string-built SQL. No `eval` or `new Function`.
6. **Redirects:** post-login targets go through `callbackUrlSchema` (same-origin paths only).
7. **CSRF / DoS:** JSON mutations go through `readJsonBody()` (requires `application/json` and a same-host `Origin`, and caps body size while streaming, so the body is never fully buffered). Never call `request.json()`/`request.text()` directly.
8. **Errors:** never send stack traces, SQL, or `error.message` from caught exceptions to clients.
   Auth failures use the generic "Invalid email or password".
9. Security headers are set in `next.config.ts`. Don't weaken them without team review.
10. `DEV_MOCK_SESSION_ROLE` only works when `NODE_ENV === "development"`. Never remove that guard.

## Git workflow (Constitution VI)

- Branch from an up-to-date `main`: `feature/<short-description>` (e.g. `feature/dog-crud`). Never commit to `main`.
- Small, focused commits in the imperative mood (`Add walker search filters`).
- Before pushing: `npm run lint` and `npx tsc --noEmit` must pass (plus tests once they're set up).
- Open a PR with what changed, how you tested it, and any new dependency with its justification. It needs one approving teammate review.
- Never bypass hooks (`--no-verify`), never force-push shared branches, and never commit `.env.local`.
