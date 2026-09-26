# Paws & Paths: instructions for Claude Code

This file is loaded when Claude Code (`claude` CLI) starts at the repository root. It is the
team's shared AI-assistant guide, our equivalent of `.github/copilot-instructions.md`.

The app lives in `team-app/`. Its full guide is imported below: stack, directory layout, domain
model, naming conventions, design tokens, security rules, and git workflow.

@team-app/CLAUDE.md

## Working from the repository root

- Run npm commands inside `team-app/` (`npm run dev`, `npm run build`, `npm run lint`, `npx tsc --noEmit`).
- The spec (`specs/001-paws-and-paths/spec.md`) and constitution (`.specify/memory/constitution.md`)
  are the sources of truth. When they change, update `team-app/CLAUDE.md` in the same PR.
- Each GitHub issue on the project board maps to a user story in the spec (e.g. issue #2 = story A1).
  Mention the issue in the PR body (`Closes #2`) and the story or FR id in code comments.
