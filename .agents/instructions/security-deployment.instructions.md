---
applyTo: 'Dockerfile*,docker-compose*,compose*.yml,compose*.yaml,.dockerignore,.gitignore,.github/workflows/**,src/server/**'
description: 'Secrets, runtime data, authentication, container, and static deployment safeguards'
---

# Security, Secrets, and Deployment

Apply to Docker, GitHub Actions/Pages, configuration, authentication, runtime data, logs, and deployment documentation.

## Keep sensitive data out of GitHub

- Never commit real passwords, API keys, session secrets, tokens, private user/expense data, populated runtime JSON, production `.env` files, database dumps, or backups.
- Keep runtime JSON storage outside the repository and Docker build context. Add appropriate `.gitignore` and `.dockerignore` rules when configuring the backend/container.
- Provide `.env.example` only with clearly fake placeholders. Do not put usable secrets in examples, tests, Storybook stories, docs, screenshots, or issue templates.
- Inject production secrets at runtime through environment configuration or Docker secrets. Do not use committed defaults or random per-process production secrets.
- Keep GitHub Actions permissions minimal and scope repository secrets to jobs that need them. GitHub Pages output is frontend-only: include public configuration/static assets only.
- Avoid logging request bodies, credentials, tokens, cookies, session identifiers, or real expense data. Health responses and errors must not reveal secrets, paths, or user records.
- Use synthetic fixtures and inspect staged changes for accidental private data before committing or publishing.

## Authentication

- Use password hashes, HTTP-only session cookies, and a persistent production session secret.
- Provision the initial admin through an explicit first-run flow or another safe setup mechanism; never ship a known default password.
- Protect write endpoints by role. Keep the public health endpoint minimal and unauthenticated for connectivity checks.

## Docker isolation

- Use unique image/container names, labels, host ports, and persistent data directories for each application instance.
- Configure a documented, overridable host port and avoid conflicts with other services on the same host. Isolated containers can use the same internal port.
- Run as a non-root user where practical. Document UID/GID and host volume permissions.
- Persist JSON through an explicit host mount; do not rely on writable container layers for user data.
- Point Docker health checks at Expense Exchange's own health endpoint.

## GitHub Pages and CORS

- GitHub Pages hosts only the Angular frontend, never NestJS or Docker.
- Frontend API URLs are public configuration, not secrets. An API reachable from the browser may expose the API to the public internet; configure authentication and CORS accordingly.
- Do not embed a private LAN endpoint as if universally reachable. A LAN-only API cannot be reached by demo users outside that LAN.
