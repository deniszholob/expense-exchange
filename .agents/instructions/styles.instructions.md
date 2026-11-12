---
applyTo: 'src/client/**/*.html,src/client/**/*.css,postcss.config.*'
description: 'Dark finance design system, Tailwind tokens, and icon use'
---

# Design System and Styling

Apply to Tailwind configuration, global styles, and shared UI components.

## Theme foundation

- Use Tailwind CSS v4.
- Define reusable CSS custom properties and Tailwind theme tokens for the dark palette, text, surfaces, borders, spacing, radii, shadows, and semantic states.
- Prefer named design tokens and shared utilities/components over duplicated arbitrary color/spacing values.
- Maintain readable contrast and visible focus states across the dark theme.

## Finance visual language

- Use a recognizable finance-oriented interface: clear hierarchy for totals and balances, aligned/tabular numbers, concise labels, and consistent semantic treatments for positive, negative, neutral, and warning states.
- Keep charts/tables and dense data readable. Do not use color alone to communicate meaning.
- Keep decoration restrained so financial values and actions remain easy to scan.
- Use `@lucide/angular` icons with consistent sizing and accessible labels; avoid mixing icon libraries.

## Scope

- Apply the shared visual system to new or touched UI during architecture setup. Avoid a broad redesign of every screen unless needed to preserve parity or establish shared primitives.
- Keep Tailwind source scanning/configuration correct for Angular and Storybook builds.
