# Paws & Paths: instructions for Claude Code

This file is loaded whenever Claude Code (`claude` CLI) runs anywhere in this repository (it reads
`CLAUDE.md` files from the folder it starts in and every parent folder). It is the team's shared
AI-assistant guide; `.github/copilot-instructions.md` points GitHub Copilot at the same guide.

The app lives in `team-app/`. Its full guide is imported below: stack, directory layout, domain
model, naming conventions, design tokens, security rules, and git workflow.

@team-app/CLAUDE.md

## Working from the repository root

- Run npm commands inside `team-app/` (`npm run dev`, `npm run build`, `npm run lint`, `npx tsc --noEmit`).
- The spec (`specs/001-paws-and-paths/spec.md`) and constitution (`.specify/memory/constitution.md`)
  are the sources of truth. Keep them and the guide in sync both ways, in the same PR:
  - When the spec or constitution changes, update `team-app/CLAUDE.md`.
  - When a PR adds or changes an endpoint, requirement, or rule, update `spec.md` (for example the §6 API table).
- Each GitHub issue on the project board maps to a user story in the spec (e.g. issue #2 = story A1).
  Mention the issue in the PR body (`Closes #2`) and the story or FR id in code comments.
