# Expense Exchange — Agent Instructions

Expense Exchange is a finance app intended to run as a self-hosted Angular + NestJS application in Docker, with a standalone browser demo and a future Electron wrapper.

## Repository rules

- Before changing a subsystem, read its applicable guide under `.agents/instructions/`.
- Read `.agents/instructions/typescript.instructions.md` for all TypeScript changes.
- Check `package.json` and the actual source tree before choosing commands or assuming where a feature lives.
- Keep repository instructions focused on lasting project rules. Put task plans and temporary decisions in planning artifacts, not `AGENTS.md` or `.agents/`.

## Project architecture

- Use Angular CLI for the frontend and Nest CLI for the backend. Do not use or add Nx dependencies, configuration, or commands.
- Build the Angular UI from focused standalone components composed into features and pages. See `.agents/instructions/angular.instructions.md`.
- Keep shared domain contracts independent from UI, HTTP transport, and persistence. See `.agents/instructions/architecture.instructions.md`.
- Keep Local File, Web Storage, and Remote API as selectable client data sources behind a stable boundary.
- Docker is the primary deployment: one Expense Exchange container serves the frontend and API. The GitHub Pages build is frontend-only. See `.agents/instructions/security-deployment.instructions.md`.
- Electron is a desktop wrapper for the Angular frontend. Keep desktop capabilities behind a narrow, validated bridge. See `.agents/instructions/electron.instructions.md`.

## Development standards

- Use pnpm. Follow the versions and scripts declared in `package.json`.
- Follow `.agents/instructions/` for TypeScript, Angular, NestJS, architecture, security, styling, Electron, and testing rules.
- Use ESLint, Prettier, Vitest, Playwright, and Storybook through the repository scripts in `package.json`.
- Keep generated Angular API clients in `src/client/api/generated/`; do not edit generated files. Keep their guide at `src/client/api/README.md`. Update Nest source APIs/models and run the generator rather than modifying generated files; keep hand-authored client API code with the relevant shared client code.
- Treat `.dist/` and `.builds/` as generated output; do not modify bundles or packages as source code.

## Scope and data safety

- Preserve existing user-visible Expense Exchange behavior. Keep changes within the requested feature or maintenance scope.
- Follow `.agents/instructions/architecture.instructions.md` for data and persistence boundaries and `.agents/instructions/security-deployment.instructions.md` for secrets and deployment safeguards.
- Never perform external actions such as sending messages or publishing deployments unless explicitly requested.

## Before finishing a code task

- Run only focused checks relevant to the change, and report which checks ran. Do not run tests unless the user asks for testing or verification.
- Summarize changed files and any important limitations in plain language.
