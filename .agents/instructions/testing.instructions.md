---
applyTo: '**/*.{spec,test,stories}.ts,**/*.cy.ts,vitest.config.*,playwright.config.*,**/playwright/**'
description: 'Vitest, Playwright, Storybook, lint, and formatting requirements'
---

# Testing, Storybook, Lint, and Formatting

Apply to unit/component tests, browser end-to-end tests, Storybook, and code-quality configuration.

## Required tools

- **Vitest** is the unit-test runner.
- **Playwright** is the end-to-end browser runner. Add Electron automation only when wrapper behavior requires it.
- **Storybook** documents and previews Angular components.
- **ESLint** and **Prettier** are required and remain available through package scripts and CI.
- Do not add Jest or Cypress as replacement/parallel test frameworks.

## Test practices

- Use Vitest for focused domain, service, adapter, and component behavior tests.
- Use Playwright for flows crossing routing, API connectivity, login, data-source selection, and UI health status.
- Keep API tests independent of real user data. Use synthetic fixtures and isolated temporary JSON stores.
- Cover JSON repository validation/failure cases without placing data stores or generated reports in tracked source paths.
- Storybook stories use synthetic and non-sensitive fixtures only.

## Commands and changes

- Inspect `package.json` for the supported scripts and use those commands.
- Prefer focused verification over broad suites. Run tests/checks only when requested or required by the active task's instructions.
- Keep test configuration compatible with Angular/TypeScript versions and avoid Nx-specific runners.
- Use ESLint for static checks/fixes and Prettier for formatting; avoid overlapping formatter responsibilities.
