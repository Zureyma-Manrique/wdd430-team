<!--
Sync Impact Report
==================
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles I–VI
  - Technology Stack & Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ⚠ pending (spec-kit templates not yet installed in this repo;
    when added, the "Constitution Check" gate must reference Principles I–VI)
  - .specify/templates/spec-template.md ⚠ pending (same as above)
  - .specify/templates/tasks-template.md ⚠ pending (task categories must include test tasks per Principle IV)
Follow-up TODOs: None
-->

# Paws & Paths Constitution

Paws & Paths is a full-stack web application that connects pet owners with local, trusted dog
walkers. It enables dog profile management, walk scheduling, and real-time session reviews.
This constitution defines the non-negotiable engineering principles for the project. The
application lives in `team-app/`.

## Core Principles

### I. Server-First Next.js Architecture

- React Server Components (RSC) are the default for data fetching, layouts, and static content.
- `'use client'` MUST be reserved for components that require interactivity, browser APIs, or
  client state (e.g., interactive calendar, form inputs, modal dialogs). Client components MUST
  be kept as small leaf components; server components pass data down to them as props.
- Routing MUST use the App Router with feature subdirectories: `app/dashboard`, `app/dogs`,
  `app/walks`, and `app/api`.
- Each route segment that renders UI MUST use the standard conventions where applicable:
  `layout.tsx` for shared shells, `loading.tsx` for loading UI, and `error.tsx` for error
  boundaries.
- Server-side filtering, schedule management, and CRUD operations MUST be implemented as
  Route Handlers (`app/api/.../route.ts`).
- The project uses Next.js 16. Before using any framework API, contributors MUST check the
  bundled docs in `node_modules/next/dist/docs/` and heed deprecation notices rather than
  relying on knowledge of older versions.

**Rationale**: Server-first rendering minimizes client JavaScript, keeps data access and secrets
on the server, and gives every route consistent loading and error behavior.

### II. Strict Type Safety (NON-NEGOTIABLE)

- `tsconfig.json` MUST keep `"strict": true`.
- The `any` type is forbidden, explicit or implicit. Use `unknown` plus narrowing, generics, or
  precise types instead. ESLint MUST enforce `@typescript-eslint/no-explicit-any` as an error.
- Core domain models MUST have explicit, shared type definitions: `PetOwner`, `Walker`,
  `DogProfile`, `WalkBooking`, and `WalkerReview` (plus supporting types such as
  `WalkBookingStatus`).
- All input crossing a trust boundary MUST be validated at runtime with Zod. This covers every
  Route Handler (request body, params, and search params) and every client form. Where
  practical, TypeScript types for validated data SHOULD be derived from the Zod schema
  (`z.infer`) so the schema and type cannot drift.

**Rationale**: Compile-time types catch mistakes inside the codebase; runtime validation catches
bad data entering it. Both are needed.

### III. Utility-First Styling & Consistent Design System

- Styles MUST be written with Tailwind CSS utility classes.
- Custom CSS is allowed only in `app/globals.css`, and only for global CSS variables and design
  tokens (Tailwind v4 `@theme`) or complex keyframe animations. Component-scoped CSS files and
  CSS modules are not allowed.
- The palette, typography, and spacing MUST come from shared design tokens so that dashboard
  components, walk status badges, and role-based views (owner vs. walker) look consistent.
  Hard-coded one-off colors are not allowed.
- Repeated UI patterns (for example, status badges for each `WalkBookingStatus`) MUST be
  implemented once as a shared component, not re-styled per page.
- Every view MUST be responsive and mobile-first, using the `sm:`, `md:`, and `lg:` breakpoints.

**Rationale**: A single styling approach and token set keeps the UI consistent across a team and
prevents style drift.

### IV. Layered Testing Discipline

- **Unit & integration** (Vitest): core business logic, Route Handlers, and utilities (such as
  schedule date filtering and CRUD operations) MUST have tests.
- **Component** (React Testing Library): interactive client components (such as booking form
  submission and review ratings) MUST have tests that check user-visible behavior, not
  implementation details.
- **End-to-end** (Playwright): the critical user journeys MUST be covered: authentication, dog
  profile management, and walk scheduling.
- A bug fix MUST include a test that reproduces the bug.
- A feature is not complete until its tests pass in CI.

**Rationale**: Each layer catches a different class of failure. Covering the critical journeys
end-to-end protects the flows users depend on most.

### V. Consistent Naming Conventions

| Item                       | Convention  | Example                                   |
| -------------------------- | ----------- | ----------------------------------------- |
| Files & directories        | kebab-case  | `dog-profile-card.tsx`, `walk-history/`   |
| React components           | PascalCase  | `DogProfileCard`, `WalkScheduler`         |
| Functions, hooks, variables| camelCase   | `fetchWalkSchedule`, `isWalker`           |
| Types & interfaces         | PascalCase  | `DogProfile`, `WalkBookingStatus`         |

- Next.js reserved file names (`page.tsx`, `layout.tsx`, `route.ts`, and so on) keep their
  required names.
- Names MUST be descriptive and use domain terms (owner, walker, dog, walk, booking, review)
  consistently.

**Rationale**: Predictable names make the codebase easy to navigate and search for every team
member.

### VI. Collaborative Team Workflow

- Work MUST happen on feature branches cut from `main` and named `feature/<short-description>`
  (e.g., `feature/dog-crud`, `feature/schedule-api`). Direct commits to `main` are not allowed.
- Every change MUST be merged through a pull request with at least one approving review from
  another team member.
- All CI checks MUST pass before merge: ESLint, TypeScript type-check (`tsc --noEmit`), and
  automated tests.
- Formatting MUST be uniform, enforced by ESLint and Prettier and run on staged files by a
  Husky pre-commit hook (via lint-staged). Hooks MUST NOT be bypassed (`--no-verify`).

**Rationale**: Reviews and automated gates keep `main` always releasable and spread knowledge
across the team.

## Technology Stack & Constraints

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript 5 in strict mode
- **Styling**: Tailwind CSS v4 (CSS-first configuration via `@theme` in `globals.css`)
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library (unit, integration, component); Playwright (E2E)
- **Quality tooling**: ESLint (`eslint-config-next`), Prettier, Husky, lint-staged
- New runtime dependencies MUST be justified in the PR description. Alternatives to the tools
  above (e.g., Jest, Cypress) MUST NOT be introduced alongside them; switching requires a
  constitution amendment.

## Development Workflow & Quality Gates

1. Create a `feature/*` branch from an up-to-date `main`.
2. Write the spec or plan for non-trivial features and confirm it passes the Constitution Check
   (Principles I–VI).
3. Implement with tests for each applicable layer (Principle IV).
4. The pre-commit hook formats and lints staged files.
5. Open a PR describing the change and how it was tested.
6. CI runs lint, type-check, and tests. All MUST pass.
7. At least one teammate reviews and approves. Reviewers MUST check constitution compliance.
8. Merge into `main` and delete the feature branch.

## Governance

- This constitution supersedes all other development practices for Paws & Paths. Where a
  guideline conflicts with it, the constitution wins.
- **Amendments** require a pull request that edits this file, describes the change and its
  rationale, updates any dependent templates or docs, and is approved by the team.
- **Versioning** follows semantic versioning:
  - MAJOR: a principle is removed or redefined in a backward-incompatible way.
  - MINOR: a new principle or section is added, or guidance is materially expanded.
  - PATCH: clarifications, wording, or typo fixes with no change in meaning.
- **Compliance**: every PR review MUST verify adherence. Any deviation MUST be justified in the
  PR and recorded in the plan's complexity tracking; unjustified violations block merge.
- Runtime development guidance for AI agents lives in `team-app/AGENTS.md` and
  `team-app/CLAUDE.md` and MUST stay consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
