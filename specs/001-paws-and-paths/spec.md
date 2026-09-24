# Feature Specification: Paws & Paths — Core Platform

**Feature Branch**: `feature/new` (to be split into per-story branches, e.g. `feature/dog-crud`, `feature/schedule-api`)
**Created**: 2026-09-23
**Status**: Draft
**Governed by**: [Paws & Paths Constitution v1.0.0](../../.specify/memory/constitution.md)

---

## 1. Project Title & Description

**Paws & Paths** is a full-stack web application that connects pet owners with local, trusted dog
walkers. Owners create profiles for their dogs, find walkers near them, and book walks. Walkers
manage incoming requests and their schedule, and update each walk's status as it happens. Once a
walk is complete, the owner can rate and review the walker. Reviews appear on the walker's
public profile right away, which builds trust for future owners.

## 2. Purpose & Target Audience

### Purpose

- Give owners one place to store their dogs' care details and book reliable walks.
- Give walkers a lightweight tool to accept work, manage their schedule, and build a reputation.
- Build trust through verified reviews: only an owner whose walk was actually completed can
  review the walker.

### Target Audience

| Persona | Description | Primary goals |
|---|---|---|
| **Pet Owner** | Busy professionals, travelers, or people with limited mobility who own one or more dogs | Store dog details once, find a nearby walker with good ratings, book and track walks |
| **Dog Walker** | Independent local walkers (students, part-time or full-time pet-care workers) | Show their services and rate, accept or decline requests, manage their daily schedule, earn good reviews |

**Out of scope for this release**: payments, in-app chat, GPS route tracking, admin moderation
tools, native mobile apps, and multi-role accounts (one account is either an owner or a walker).

---

## 3. User Scenarios & Testing *(mandatory)*

Stories are ordered by priority. Each one can be built, tested, and demoed on its own. They are
grouped under the four core workflows.

### Workflow A — User Authentication & Role Profiles

#### User Story A1 — Sign up and choose a role (Priority: P0)

As a new visitor, I want to create an account and choose whether I am a pet owner or a dog
walker, so that the app shows me the right tools.

**Why this priority**: Every other feature depends on knowing who the user is and what role they
have.

**Independent Test**: Sign up as an owner and as a walker, sign out, sign back in, and confirm
each account lands on the correct role dashboard.

**Acceptance Scenarios**:

1. **Given** I am a signed-out visitor, **When** I sign up with a valid email and password (or an
   OAuth provider) and choose the role "Owner", **Then** my account is created with the role
   `OWNER` and I am redirected to `/dashboard`, which shows the owner view.
2. **Given** I am a signed-out visitor, **When** I sign up and choose the role "Walker",
   **Then** my account is created with the role `WALKER` and I am asked to complete my walker
   profile before I appear in search results.
3. **Given** an account already exists for `jane@example.com`, **When** I try to sign up with the
   same email, **Then** I see the error "An account with this email already exists" and no
   duplicate account is created.
4. **Given** I submit the sign-up form with an invalid email or a password shorter than 8
   characters, **When** the form is validated, **Then** I see an inline error on each invalid
   field and the form is not submitted.
5. **Given** I am signed out, **When** I visit any route under `/dashboard`, `/dogs`, or `/walks`,
   **Then** I am redirected to the sign-in page, and after signing in I return to the page I
   originally requested.

---

#### User Story A2 — Sign in and sign out (Priority: P0)

As a registered user, I want to sign in and out securely, so that only I can access my data.

**Independent Test**: Sign in with correct and incorrect credentials, then sign out, and confirm
that protected pages and APIs are no longer accessible.

**Acceptance Scenarios**:

1. **Given** I have an account, **When** I sign in with the correct credentials, **Then** a session
   is created and I am redirected to `/dashboard`.
2. **Given** I have an account, **When** I sign in with a wrong password, **Then** I see the generic
   message "Invalid email or password" (the message does not reveal which field was wrong).
3. **Given** I am signed in, **When** I click "Sign out", **Then** my session ends and any request
   to a protected API returns `401 Unauthorized`.

---

#### User Story A3 — Manage my role profile (Priority: P1)

As a user, I want to edit my profile. As an owner, that is my name, phone, and neighborhood. As
a walker, it also includes my bio, service area, hourly rate, and photo. This lets others know
who I am.

**Independent Test**: Edit each field, reload the page, and confirm the changes were saved. As a
walker, confirm the changes appear on the public walker profile.

**Acceptance Scenarios**:

1. **Given** I am a signed-in walker, **When** I save a bio (max 500 characters), a service-area
   postal code, and an hourly rate between $5 and $200, **Then** my profile is saved and
   `GET /api/walkers/{myId}` returns the new values.
2. **Given** I am a walker with an incomplete profile (missing a service area or rate), **When**
   owners search for walkers, **Then** I do not appear in the results.
3. **Given** I enter an hourly rate of `-10`, **When** I submit, **Then** I see a validation
   error and nothing is saved.
4. **Given** I am an owner, **When** I try to call `PATCH /api/walkers/me`, **Then** I receive
   `403 Forbidden`.

---

### Workflow B — Dog Profile CRUD

#### User Story B1 — Create and view dog profiles (Priority: P0)

As an owner, I want to add my dogs with their care details, so that walkers know how to handle
them.

**Why this priority**: A walk can't be booked without a dog.

**Independent Test**: Add a dog, see it in the list at `/dogs`, and open its detail page.

**Acceptance Scenarios**:

1. **Given** I am a signed-in owner, **When** I submit the "Add dog" form with name "Biscuit",
   breed "Beagle", size "Medium", birth date, and optional notes ("Pulls on leash; afraid of
   bikes"), **Then** the dog is created and appears in my list at `/dogs`.
2. **Given** I leave the name empty or choose a birth date in the future, **When** I submit,
   **Then** I see inline errors and the dog is not created.
3. **Given** I have 3 dogs, **When** I open `/dogs`, **Then** I see exactly my 3 dogs as cards
   (name, breed, size, photo placeholder) and never see another owner's dogs.
4. **Given** I am a walker, **When** I open the Add Dog page or call `POST /api/dogs`, **Then**
   I am denied (`403`).

---

#### User Story B2 — Update and delete dog profiles (Priority: P0)

As an owner, I want to edit or remove a dog profile, so that its information stays accurate.

**Independent Test**: Edit a dog's notes and confirm the change is saved. Delete a dog with no
upcoming walks and confirm it disappears from the list.

**Acceptance Scenarios**:

1. **Given** I own "Biscuit", **When** I change the size to "Large" and save, **Then** the detail
   page shows "Large" and `GET /api/dogs/{id}` returns `size: "LARGE"`.
2. **Given** I own "Biscuit" and it has no pending or confirmed upcoming walks, **When** I delete
   it and confirm the dialog, **Then** it no longer appears in my dog list or in the dog picker on
   the booking form. Its past walks and reviews are still shown in my history (the dog is
   archived, not hard-deleted).
3. **Given** "Biscuit" has an upcoming confirmed walk, **When** I try to delete it, **Then** I
   receive the message "Cancel upcoming walks for this dog before removing it" (`409 Conflict`)
   and the dog is not deleted.
4. **Given** another owner's dog ID, **When** I call `PATCH` or `DELETE /api/dogs/{id}`, **Then**
   I receive `404 Not Found`, so the API does not reveal that the dog exists.

---

### Workflow C — Walk Booking & Schedule Management CRUD

#### User Story C1 — Find a walker (Priority: P0)

As an owner, I want to browse walkers in my area with their rates and ratings, so that I can
choose someone I trust.

**Independent Test**: Seed walkers in several postal codes, search by one postal code, and
confirm only matching walkers with complete profiles are listed.

**Acceptance Scenarios**:

1. **Given** walkers exist in postal codes 84604 and 84101, **When** I search with postal code
   `84604`, **Then** only walkers serving 84604 are listed. Each shows name, photo, hourly rate,
   average rating (1 decimal), and review count.
2. **Given** I set the filter "Minimum rating: 4", **When** results load, **Then** only walkers
   with an average rating of 4.0 or higher are shown. Walkers with no reviews are hidden while
   this filter is active.
3. **Given** I sort by "Price: low to high", **When** results load, **Then** walkers are
   ordered by hourly rate ascending.
4. **Given** no walkers match, **When** results load, **Then** I see an empty state that suggests
   widening the search.

---

#### User Story C2 — Book a walk (Priority: P0)

As an owner, I want to request a walk for one of my dogs with a chosen walker, date, time, and
duration, so that my dog gets exercise while I'm away.

**Why this priority**: Booking is the core value of the product.

**Independent Test**: Book a walk. Confirm it appears as "Pending" on the owner's dashboard and
as a new request on the walker's dashboard.

**Acceptance Scenarios**:

1. **Given** I own "Biscuit" and have selected walker "Sam", **When** I request a 30-minute walk
   for tomorrow at 10:00 with pickup notes, **Then** a booking is created with status `PENDING`,
   and it appears in my upcoming walks and in Sam's requests.
2. **Given** I pick a start time less than 1 hour from now or more than 60 days away, **When** I
   submit, **Then** I see the error "Walks must be booked between 1 hour and 60 days in advance".
3. **Given** Sam already has a `PENDING` or `CONFIRMED` walk from 10:00 to 10:45 tomorrow,
   **When** I request 10:30 tomorrow, **Then** I receive `409 Conflict` with the message "This
   walker is not available at that time".
4. **Given** I choose a duration other than 30, 45, or 60 minutes, **When** I submit, **Then**
   the request is rejected with a validation error.
5. **Given** I try to book using a dog I don't own, **When** I call `POST /api/walks`, **Then** I
   receive `404 Not Found`.

---

#### User Story C3 — Walker accepts or declines requests (Priority: P0)

As a walker, I want to accept or decline walk requests, so that I only commit to walks I can do.

**Independent Test**: As a walker, accept one pending request and decline another, then check
that both statuses are updated on the owner's dashboard.

**Acceptance Scenarios**:

1. **Given** I am walker "Sam" with a `PENDING` request, **When** I click "Accept", **Then** the
   status becomes `CONFIRMED` and the owner sees a "Confirmed" badge.
2. **Given** a `PENDING` request, **When** I click "Decline", **Then** the status becomes
   `DECLINED` and the time slot is free for other bookings.
3. **Given** a request whose start time has already passed while still `PENDING`, **When**
   anyone views it, **Then** it is shown as `EXPIRED` and can no longer be accepted.
4. **Given** I am a walker who is not assigned to the booking, **When** I try to change its
   status, **Then** I receive `404 Not Found`.

---

#### User Story C4 — View and filter my schedule (Priority: P0)

As an owner or walker, I want to see my walks as a list and on a calendar, filtered by date
range and status, so that I can plan my day.

**Independent Test**: Seed walks across several days and statuses, apply filters, and confirm
the results match the filters exactly.

**Acceptance Scenarios**:

1. **Given** I have walks on Mon, Wed, and Fri, **When** I filter `from=Mon to=Wed`, **Then** I see
   only the Mon and Wed walks, sorted by start time ascending.
2. **Given** I filter by status `CONFIRMED`, **When** results load, **Then** only confirmed walks
   are shown.
3. **Given** I switch to the calendar view, **When** I click a day, **Then** I see that day's
   walks with their status badges, and clicking a walk opens its details.
4. **Given** walks are stored in UTC, **When** I view my schedule, **Then** times are shown in my
   browser's local time zone, and a date filter includes every walk that starts on that local
   calendar day.
5. **Given** I am an owner, **When** I load my schedule, **Then** I see only my own bookings. A
   walker sees only bookings assigned to them.

---

#### User Story C5 — Reschedule or cancel a walk (Priority: P1)

As an owner, I want to reschedule or cancel a walk that hasn't started, so that I can adjust
when plans change.

**Independent Test**: Reschedule a pending walk, then cancel a confirmed walk, and confirm both
parties see the update.

**Acceptance Scenarios**:

1. **Given** a `PENDING` or `CONFIRMED` walk that starts in more than 2 hours, **When** I change
   the start time to a free slot, **Then** the walk is updated and its status returns to
   `PENDING`, so the walker must confirm again.
2. **Given** a `PENDING` or `CONFIRMED` walk, **When** I cancel it and give an optional reason,
   **Then** the status becomes `CANCELLED` and the walker sees the cancellation.
3. **Given** a walk that is `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`, **When** I try to
   reschedule or cancel it, **Then** I receive `409 Conflict` with the message "This walk can no
   longer be changed".
4. **Given** I am the assigned walker on a `CONFIRMED` walk, **When** I cancel it, **Then** the
   status becomes `CANCELLED` and the owner sees who cancelled it.

---

#### User Story C6 — Live walk session status (Priority: P1)

As a walker, I want to mark a walk as started and finished. As an owner, I want to see those
updates without refreshing the page, so that I know my dog is safe.

**Independent Test**: Open the owner's walk detail page in one browser. In another browser,
start and then finish the walk as the walker. Confirm the owner's page updates each time
within 15 seconds without a manual refresh.

**Acceptance Scenarios**:

1. **Given** a `CONFIRMED` walk whose start time is within 15 minutes of now, **When** the walker
   clicks "Start walk", **Then** the status becomes `IN_PROGRESS` and the actual start time is
   recorded.
2. **Given** a walk is `IN_PROGRESS`, **When** the walker clicks "End walk" and adds optional
   session notes (e.g., "Did his business twice, drank water"), **Then** the status becomes
   `COMPLETED`, the actual end time is recorded, and the notes are shown to the owner.
3. **Given** the owner has the walk detail page open, **When** the status changes, **Then** the
   page shows the new status within 15 seconds without a manual reload.
4. **Given** a `CONFIRMED` walk whose start time is more than 15 minutes away, **When** the
   walker tries to start it, **Then** the action is rejected with "You can start this walk up to
   15 minutes before its scheduled time".

---

### Workflow D — Walker Reviews & Ratings CRUD

#### User Story D1 — Review a completed walk (Priority: P1)

As an owner, I want to rate (1–5 stars) and review my walker as soon as a walk is completed, so
that other owners can make informed choices.

**Why this priority**: Reviews are what make walkers trustworthy, but they depend on walks being
completed first.

**Independent Test**: Complete a walk, submit a review, and confirm it immediately appears on the
walker's public profile and updates their average rating.

**Acceptance Scenarios**:

1. **Given** my walk with Sam is `COMPLETED` and I haven't reviewed it yet, **When** I submit
   4 stars and the comment "Great with my anxious pup", **Then** the review is saved, linked to
   that walk, and shown on Sam's profile. Sam's average rating and review count update
   immediately.
2. **Given** a walk that is not `COMPLETED`, **When** I try to review it, **Then** I receive
   `409 Conflict` with the message "You can only review completed walks".
3. **Given** I already reviewed this walk, **When** I try to submit another review for it,
   **Then** I receive `409 Conflict`. Each walk can have at most one review.
4. **Given** I choose 0 or 6 stars, or write a comment longer than 1,000 characters, **When** I
   submit, **Then** I see a validation error.
5. **Given** I am on the rating widget, **When** I use the keyboard (arrow keys, then Enter),
   **Then** I can select and submit a rating without a mouse.

---

#### User Story D2 — Read walker reviews (Priority: P1)

As an owner, I want to read a walker's reviews before booking.

**Acceptance Scenarios**:

1. **Given** Sam has 25 reviews, **When** I open Sam's profile, **Then** I see the 10 newest
   reviews (rating, comment, reviewer's first name, dog name, date) and a "Load more" control.
2. **Given** a walker has no reviews, **When** I open their profile, **Then** I see "No reviews
   yet" in place of a rating.

---

#### User Story D3 — Edit or delete my review (Priority: P2)

As an owner, I want to edit or delete a review I wrote, so that I can correct mistakes.

**Acceptance Scenarios**:

1. **Given** I wrote a review 3 days ago, **When** I change the rating from 4 to 5, **Then** the
   review is updated, marked "Edited", and Sam's average rating is recalculated.
2. **Given** I wrote a review more than 30 days ago, **When** I try to edit it, **Then** I
   receive `409 Conflict` with the message "Reviews can only be edited within 30 days". Deleting
   the review is still allowed.
3. **Given** I delete my review, **When** Sam's profile loads, **Then** the review is gone and
   the average rating and review count are recalculated.
4. **Given** a review written by someone else, **When** I try to edit or delete it, **Then** I
   receive `404 Not Found`.

---

#### User Story D4 — Walker responds to a review (Priority: P2)

As a walker, I want to post one public reply to each review, so that I can thank owners or
address concerns.

**Acceptance Scenarios**:

1. **Given** I am Sam and have a review with no reply, **When** I post a reply (max 500
   characters), **Then** it is shown under the review on my profile.
2. **Given** a review that already has my reply, **When** I post again, **Then** my existing
   reply is replaced. There is never more than one reply per review.

---

### Edge Cases

- **Time zones and DST**: all timestamps are stored in UTC. Date-range filters are calculated
  from the viewer's time zone, which the client sends as an IANA time-zone name. The schedule
  filter must include walks that fall on either side of a daylight-saving change.
- **Concurrent bookings**: two owners request the same walker's slot at the same moment. Only
  one booking succeeds; the other receives `409`. This must be enforced by the database, not
  just by an application-level check.
- **Walker deactivates their profile** while they still have upcoming walks: their pending and
  confirmed walks are cancelled and the owners see the cancellation.
- **Archived dog**: stays visible in past walks and reviews, but can't be booked or edited.
- **Session expiry during form entry**: the user is redirected to sign in and the form draft is
  kept (client-side) where practical.
- **Stale status**: the owner views a walk after the walker's action but before the next status
  refresh. Any action the owner takes is re-checked against the current state on the server,
  which returns `409` if the walk is no longer in the expected state.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

**Authentication & Roles**
- **FR-001**: The system MUST let users sign up and sign in with email/password and at least one
  OAuth provider (Google).
- **FR-002**: Each account MUST have exactly one role, `OWNER` or `WALKER`, chosen at sign-up.
  The role cannot be changed through the UI in this release.
- **FR-003**: Every non-public page and every API endpoint except public walker profiles and
  reviews MUST require an authenticated session. Requests without one MUST receive `401`.
- **FR-004**: Every data-access check MUST make sure the resource belongs to the requester or is
  assigned to them. A resource the requester can't access MUST return `404`, so the API doesn't
  reveal whether it exists.

**Dog Profiles**
- **FR-010**: Owners MUST be able to create, read, update, and archive (soft-delete) their dogs.
- **FR-011**: A dog MUST have a name (1–50 characters) and a size (`SMALL | MEDIUM | LARGE |
  XLARGE`). It MAY have a breed, birth date (not in the future), weight in kg (0.5–120), care
  notes (≤1,000 characters), and a photo URL.
- **FR-012**: A dog with upcoming `PENDING` or `CONFIRMED` walks MUST NOT be archived.

**Walks & Scheduling**
- **FR-020**: Owners MUST be able to request walks by choosing one of their dogs, a walker, a
  start time, and a duration of 30, 45, or 60 minutes.
- **FR-021**: A walk's start time MUST be at least 1 hour and at most 60 days in the future at
  the time of booking.
- **FR-022**: A walker MUST NOT have two `PENDING`, `CONFIRMED`, or `IN_PROGRESS` walks whose
  time ranges overlap.
- **FR-023**: Walk status changes MUST follow only the transitions below. Any other transition
  MUST be rejected with `409`.

  | From | To | Who |
  |---|---|---|
  | `PENDING` | `CONFIRMED`, `DECLINED` | Assigned walker |
  | `PENDING`, `CONFIRMED` | `CANCELLED` | Owner or assigned walker |
  | `CONFIRMED` | `IN_PROGRESS` | Assigned walker, from 15 minutes before the start time |
  | `IN_PROGRESS` | `COMPLETED` | Assigned walker |
  | `PENDING` (start time has passed) | `EXPIRED` | System (derived when read or by a scheduled job) |

- **FR-024**: Rescheduling a walk MUST reset its status to `PENDING` and follow FR-021 and FR-022.
  A walk can only be rescheduled if it starts more than 2 hours from now.
- **FR-025**: Owners and walkers MUST be able to list their own walks, filtered by date range
  (`from`, `to`), status, and (for owners) dog, sorted by start time.
- **FR-026**: Open walk detail pages MUST show status changes within 15 seconds without a
  manual reload.

**Reviews & Ratings**
- **FR-030**: An owner MUST be able to create one review for each of their `COMPLETED` walks,
  with a whole-number rating from 1 to 5 and an optional comment of ≤1,000 characters.
- **FR-031**: A walker's average rating and review count MUST reflect all of their current
  reviews immediately after a review is created, edited, or deleted.
- **FR-032**: Review authors MAY edit their review within 30 days of creating it and MAY delete
  it at any time.
- **FR-033**: A walker MAY post one reply of ≤500 characters to each review of them.
- **FR-034**: Reviews MUST be publicly readable on the walker's profile and paginated 10 at a
  time, newest first.

**Walker Profiles & Discovery**
- **FR-040**: A walker profile includes a display name, bio (≤500 characters), service-area
  postal codes (1–10), an hourly rate ($5–$200), a photo URL, and an active/inactive flag.
- **FR-041**: Walker search MUST support filtering by postal code and minimum rating, and
  sorting by rating or price. Only active walkers with a complete profile are included.

### Key Entities

- **User**: the authentication identity. It has an email, a name, a role (`OWNER | WALKER`), and
  timestamps. Each user has either one PetOwner profile or one Walker profile.
- **PetOwner**: a profile linked to a User. It has a phone number and a neighborhood/postal
  code, and owns many DogProfiles and WalkBookings.
- **Walker**: a profile linked to a User. It has a bio, service-area postal codes, an hourly
  rate, a photo, and an `isActive` flag. It has many WalkBookings and WalkerReviews. The average
  rating and review count are computed from its reviews.
- **DogProfile**: belongs to one PetOwner. It has a name, breed, size, birth date, weight, care
  notes, photo, and `archivedAt`.
- **WalkBooking**: links a DogProfile, its PetOwner, and a Walker. It has a scheduled start time,
  duration, a `WalkBookingStatus`, pickup notes, actual start and end times, session notes,
  cancellation info (who cancelled and why), and timestamps.
- **WalkerReview**: belongs to exactly one COMPLETED WalkBooking (a one-to-one link). It has a
  rating from 1 to 5, a comment, an optional walker reply, and `editedAt`.

---

## 5. Technical Requirements

All technical choices follow the [constitution](../../.specify/memory/constitution.md).

| Area | Requirement |
|---|---|
| **Framework** | Next.js 16 App Router, React 19. React Server Components are the default; `'use client'` is used only for interactive leaf components (booking form, calendar, rating widget, dialogs, live status indicator). |
| **Routes** | `app/(auth)/sign-in`, `app/(auth)/sign-up`, `app/dashboard`, `app/dogs`, `app/dogs/[id]`, `app/dogs/new`, `app/walks`, `app/walks/[id]`, `app/walks/new`, `app/walkers`, `app/walkers/[id]`, `app/api/...`. Each segment has `layout.tsx`, `loading.tsx`, and `error.tsx` where applicable. |
| **Language** | TypeScript 5 with `"strict": true`. No `any`, enforced by ESLint. Domain types (`PetOwner`, `Walker`, `DogProfile`, `WalkBooking`, `WalkerReview`, `WalkBookingStatus`) live in `lib/types/`. |
| **Validation** | Zod schemas in `lib/validation/` are shared by Route Handlers and client forms. Types are derived with `z.infer`. |
| **Styling** | Tailwind CSS v4 utility classes only. Design tokens are defined with `@theme` in `app/globals.css`. There is one shared `WalkStatusBadge` component. Layouts are mobile-first and use `sm:`, `md:`, and `lg:`. |
| **Database** | PostgreSQL 16 with the Prisma ORM. Schema changes use Prisma migrations. Overlapping walks for the same walker are prevented at the database level with an exclusion constraint on `(walkerId, tstzrange(start, end))` for active statuses, added through a raw SQL migration. |
| **Authentication** | **Auth.js (NextAuth v5)** with the Prisma adapter, a Credentials provider (bcrypt-hashed passwords), and a Google OAuth provider. Session tokens are stored in the database. Sign-in is required for protected routes, checked in the framework's request interception layer, and every Route Handler also checks the session itself. *Auth.js is chosen over Clerk because it keeps user data in our own Postgres/Prisma schema and has no per-user cost; Clerk remains a fallback if OAuth setup blocks progress.* |
| **Live updates** | The walk detail page polls `GET /api/walks/{id}` every 10 seconds while the walk is `CONFIRMED` or `IN_PROGRESS`, and stops once the walk ends. This meets FR-026 without WebSocket infrastructure. Server-Sent Events are a possible P2 upgrade. |
| **Testing** | Vitest for unit and integration tests (Route Handlers, scheduling and date-filter logic, status transitions), React Testing Library for components (booking form, rating widget), and Playwright for end-to-end tests (auth, dog CRUD, booking flow). |
| **Quality** | ESLint + Prettier + Husky/lint-staged pre-commit. CI (GitHub Actions) runs lint, `tsc --noEmit`, Vitest, and Playwright on every pull request. |
| **Hosting** | Vercel for the app, plus a managed Postgres database (e.g., Neon or Vercel Postgres). Secrets are kept in environment variables and never committed. |

### Non-Functional Requirements

- **NFR-001 Performance**: Server-rendered pages load their data within 500 ms (p95) at the
  database level. List endpoints are paginated, with a maximum of 50 items per page.
- **NFR-002 Accessibility**: WCAG 2.1 AA: keyboard-operable forms, calendar, and rating widget;
  a visible focus state; color is never the only way status is shown (badges include text).
- **NFR-003 Security**: passwords are hashed; authorization is checked on the server for every
  request; all input is validated with Zod; no secrets are sent to the client bundle.
- **NFR-004 Responsiveness**: every page is usable at 360 px width and up.

---

## 6. Core API Endpoints

All endpoints are Next.js Route Handlers under `app/api/`. Request and response bodies are JSON
and validated with Zod. Errors use the format
`{ "error": { "code": string, "message": string, "details"?: object } }`.

Status codes: `200` OK · `201` Created · `204` No Content · `400` validation error ·
`401` not signed in · `403` wrong role · `404` not found or not yours · `409` state conflict.

### Auth — `/api/auth/*`

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js handlers: sign in, sign out, session, OAuth callback | Public |
| `POST` | `/api/auth/register` | Create a credentials account `{ email, password, name, role }` | Public |

### Dogs — `/api/dogs`

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/dogs` | List my dogs. Query: `includeArchived?=false` | Owner |
| `POST` | `/api/dogs` | Create a dog `{ name, size, breed?, birthDate?, weightKg?, notes?, photoUrl? }` → `201` | Owner |
| `GET` | `/api/dogs/[id]` | Get one of my dogs | Owner (owns) |
| `PATCH` | `/api/dogs/[id]` | Partially update a dog | Owner (owns) |
| `DELETE` | `/api/dogs/[id]` | Archive a dog → `204`. Returns `409` if it has upcoming active walks | Owner (owns) |

### Walks — `/api/walks`

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/walks` | List my walks (as owner or as the assigned walker). Query: `from`, `to` (ISO dates), `tz` (IANA), `status` (comma-separated), `dogId?`, `page`, `pageSize` | Owner / Walker |
| `POST` | `/api/walks` | Request a walk `{ dogId, walkerId, startAt, durationMinutes, pickupNotes? }` → `201` with status `PENDING`. Returns `409` on overlap | Owner |
| `GET` | `/api/walks/[id]` | Walk details, including status and session notes (used for polling) | Owner or assigned walker |
| `PATCH` | `/api/walks/[id]` | Reschedule or edit notes `{ startAt?, durationMinutes?, pickupNotes? }`. Changing the time resets status to `PENDING` | Owner (owns) |
| `POST` | `/api/walks/[id]/status` | Change status `{ action: "accept" \| "decline" \| "cancel" \| "start" \| "complete", reason?, sessionNotes? }`. Validated against the FR-023 transition table | Owner or assigned walker (depends on action) |

### Reviews — `/api/reviews`

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/reviews` | List reviews. Query: `walkerId` (required), `page`, `pageSize` (default 10) | Public |
| `POST` | `/api/reviews` | Create a review `{ walkId, rating, comment? }` → `201`. Returns `409` if the walk is not completed or was already reviewed | Owner (owns the walk) |
| `PATCH` | `/api/reviews/[id]` | Edit `{ rating?, comment? }` within 30 days | Owner (author) |
| `DELETE` | `/api/reviews/[id]` | Delete a review → `204` | Owner (author) |
| `PUT` | `/api/reviews/[id]/reply` | Create or replace the walker's reply `{ reply }` | Walker (reviewed walker) |

### Walkers — `/api/walkers`

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/walkers` | Search walkers. Query: `postalCode`, `minRating?`, `sort=rating\|price`, `page`, `pageSize` | Signed-in users |
| `GET` | `/api/walkers/[id]` | Public walker profile, including `averageRating` and `reviewCount` | Public |
| `GET` | `/api/walkers/me` | My walker profile | Walker |
| `PATCH` | `/api/walkers/me` | Update `{ bio?, serviceAreaPostalCodes?, hourlyRate?, photoUrl?, isActive? }`. Setting `isActive: false` cancels upcoming walks | Walker |

---

## 7. Implementation Priority

### P0 — MVP (must ship; a demoable end-to-end booking loop)

| # | Item | Stories | Suggested branch |
|---|---|---|---|
| 1 | Project tooling: Prisma + Postgres, Zod, Vitest, Playwright, Prettier, Husky, CI | — | `feature/project-setup` |
| 2 | Auth.js setup, sign-up with role, sign-in/out, route protection | A1, A2 | `feature/auth` |
| 3 | Domain types, Zod schemas, Prisma schema + migrations, seed data | — | `feature/data-model` |
| 4 | Dog profile CRUD (API + pages) | B1, B2 | `feature/dog-crud` |
| 5 | Walker search and profile page (read-only, using seeded walkers) | C1 | `feature/walker-search` |
| 6 | Walk booking, accept/decline, schedule list with date/status filters | C2, C3, C4 (list view) | `feature/schedule-api` |
| 7 | Role-based dashboard (owner: upcoming walks and dogs; walker: requests and today's walks) | — | `feature/dashboard` |

**MVP exit criteria**: an owner can sign up, add a dog, find a walker, and book a walk. The
walker can sign in and accept it. Both see it on their schedule. All of this is covered by
Playwright tests.

### P1 — Core completeness

| # | Item | Stories |
|---|---|---|
| 8 | Walker and owner profile editing | A3 |
| 9 | Reschedule and cancel | C5 |
| 10 | Live walk session (start/end, session notes, polling) | C6 |
| 11 | Create and read reviews, average rating on walker cards | D1, D2 |
| 12 | Calendar view for the schedule | C4 (calendar) |

### P2 — Enhancements

| # | Item | Stories |
|---|---|---|
| 13 | Edit and delete reviews | D3 |
| 14 | Walker reply to reviews | D4 |
| 15 | Upgrade live updates to Server-Sent Events | C6 |
| 16 | Dog photo upload (in place of URL entry) | B1 |
| 17 | Email notifications for booking status changes | C2–C5 |

---

## 8. Success Criteria *(mandatory)*

- **SC-001**: A new owner can go from sign-up to a submitted walk request in under 5 minutes.
- **SC-002**: 100% of Route Handlers reject unauthenticated or unauthorized requests. This is
  verified by integration tests for each endpoint.
- **SC-003**: No double-booking is possible, including under concurrent requests. This is
  verified by a concurrency integration test.
- **SC-004**: Owners see walk status changes within 15 seconds.
- **SC-005**: Every P0 user journey has a passing Playwright test in CI.
- **SC-006**: `tsc --noEmit` and ESLint report zero errors, and the codebase contains no `any`.

## 9. Assumptions

- One role per account. A person who is both an owner and a walker uses two accounts.
- Walker "trust" in this release comes from reviews only. Background checks and identity
  verification are out of scope.
- Walker availability is implied: any time that isn't already booked can be requested, and the
  walker accepts or declines. Explicit weekly availability windows could be added after P2.
- Prices are shown for information only. No payments are processed.
- "Real-time session reviews" means two things: owners can review a walk as soon as it is
  marked `COMPLETED`, and the review appears on the walker's profile right away. Live status
  during the walk is covered by story C6.
