# Expense Exchange — Agent Instructions

Expense Exchange is a finance app intended to run as a self-hosted Angular + NestJS application in Docker, with a standalone browser demo and a future Electron wrapper.

## Repository rules

- Before changing a subsystem, read its applicable guide under `.agents/instructions/`.
- Read `.agents/instructions/typescript.instructions.md` for all TypeScript changes.
- Check `package.json` and the actual source tree before choosing commands or assuming where a feature lives.
- Keep repository instructions focused on lasting project rules. Put task plans and temporary decisions in planning artifacts, not `AGENTS.md` or `.agents/`.

## Project architecture

- Use Angular CLI for the frontend and Nest CLI for the backend. Do not use or add Nx dependencies, configuration, or commands.
- Keep shared domain contracts independent from UI, HTTP transport, and persistence. See `.agents/instructions/architecture.instructions.md`.
- Keep Local File, Web Storage, and Remote API as selectable client data sources behind a stable boundary.
- Docker is the primary deployment: one Expense Exchange container serves the frontend and API. The GitHub Pages build is frontend-only. See `.agents/instructions/security-deployment.instructions.md`.
- Electron is a desktop wrapper for the Angular frontend. Keep desktop capabilities behind a narrow, validated bridge. See `.agents/instructions/electron.instructions.md`.

## Development standards

- Use pnpm. Follow the versions and scripts declared in `package.json`.
- Use strict TypeScript. Avoid `any`; prefer explicit domain types and small, focused functions.
- Keep ESLint and Prettier clean. Use the repository scripts rather than ad-hoc tool versions.
- Use Vitest for unit tests, Playwright for E2E, and Storybook for component development. Do not reintroduce Jest or Cypress.
- Follow Angular, NestJS, styling, and test guidance in `.agents/instructions/`.
- Do not manually edit generated API clients or generated OpenAPI artifacts. Update the source API/models and run the documented generator.
- Do not modify build output, generated bundles, runtime JSON data, or user data as source code.

## Scope and data safety

- Preserve existing user-visible Expense Exchange behavior. Keep changes within the requested feature or maintenance scope.
- JSON is the initial backend persistence adapter. Keep persistence behind repository interfaces so a database can be added without rewriting controllers or frontend code.
- Never commit secrets, credentials, tokens, production configuration, or real user/expense data. Use synthetic fixtures and safe placeholders only. Keep runtime data outside Git and Docker build context.
- Never send messages, publish deployments, or push images unless explicitly requested.

## Before finishing a code task

- Run only focused checks relevant to the change, and report which checks ran. Do not run tests unless the user asks for testing or verification.
- Summarize changed files and any important limitations in plain language.
