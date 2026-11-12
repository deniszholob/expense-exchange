# Changelog

Notable changes to Expense Exchange are recorded here.

## [0.1.0] - 2026-11-11

### Added

- Established the Angular, NestJS, Docker, and Electron build layout under `src/`.
- Added versioned web, Docker, and desktop package output paths with individual and aggregate build commands.
- Bundled the NestJS server before Docker packaging; the Dockerfile now copies prebuilt UI and server bundles without installing dependencies or compiling source.
- Added development commands for the client, server, Storybook, JSON Server, and desktop wrapper.
- Added a local Docker smoke check.
- Added a TypeScript-only source rule and a repository check for JavaScript source files.

### Changed

- Moved client styles and static assets into `src/client/`.
- Consolidated intermediate build output under `.dist/` and release artifacts under `.builds/`.
