# Paws & Paths

**Trusted local dog walkers.** Paws & Paths connects dog owners with dog walkers in their area. Owners keep a profile for each dog, find a walker by postal code, rating and price, and request a walk. Walkers accept or decline, start and end the walk, and owners follow its status live and then review it.

- **Live app:** https://wdd430-team.vercel.app
- **Project board:** https://github.com/users/Zureyma-Manrique/projects/1
- **Full documentation** (setup, demo accounts, features, API, testing, deployment, Lighthouse results, known issues): [`team-app/README.md`](team-app/README.md)

## Try it

Sign in at the live app with a demo account (password `paws-demo-2026`):

| Role | Email |
| --- | --- |
| Owner | `jordan@example.com` |
| Walker | `sam@example.com` |

Or create your own account, with email and password or with Google.

## What is in this repository

| Path | What it is |
| --- | --- |
| [`team-app/`](team-app/) | The Next.js 16 / TypeScript app (PostgreSQL + Prisma, Auth.js, Tailwind CSS) |
| [`specs/001-paws-and-paths/`](specs/001-paws-and-paths/) | The specification: user stories, requirements and API contract |
| [`.specify/`](.specify/) | The project constitution (engineering principles) |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | CI: lint, types, formatting, unit tests, build and end-to-end tests on every pull request |
| [`CLAUDE.md`](CLAUDE.md) | Guide for AI coding assistants working in this repository |

## Run it locally

```bash
cd team-app
npm install
cp .env.example .env.local   # then set DATABASE_URL and AUTH_SECRET
npm run db:migrate
npm run db:seed
npm run dev                  # http://localhost:3000
```

Details, scripts and troubleshooting are in [`team-app/README.md`](team-app/README.md).

## Team

WDD 430 (BYU-Pathway) team project, built by Zureyma Manrique as a one-person team.
