---
applyTo: 'src/**'
description: 'Shared domain, API, data-source, and persistence boundaries'
---

# Architecture and Data Boundaries

Apply to frontend/backend structure, shared models, API clients, data sources, and persistence.

## Target project shape

- `src/client/`: Angular browser UI.
- `src/server/`: NestJS API and server-only adapters.
- `src/desktop/`: Electron main process and narrow desktop bridge code.
- `src/util/`: framework-independent shared utilities and domain contracts.
- Shared domain contracts belong in a location importable by both client and server without pulling browser-only or Node-only dependencies across the boundary.
- The Docker runtime serves the Angular build and API from one origin where practical. GitHub Pages serves only static frontend assets.
- Electron initially loads the frontend and connects through the same API/data-source abstractions. Do not add native file APIs to shared domain code.
- Keep the Angular UI, NestJS API, shared domain contracts, and infrastructure boundaries clear in the source tree and build configuration.

## Domain contracts

- Define domain schemas with Zod and derive TypeScript types from them. Avoid maintaining schemas, interfaces, API DTOs, and client models that duplicate the same shape.
- Keep domain contracts independent of Angular, Nest decorators, HTTP request objects, and filesystem APIs.
- Validate data at boundaries: API requests/responses, imported files, Web Storage reads, and JSON repository reads.
- Keep public API models separate from persistence-only fields such as password hashes and internal metadata.

## API and generated client

- NestJS controllers/services and shared schemas are the source of truth for API behavior.
- Generate OpenAPI from the Nest application using Swagger integration. Expose interactive docs at `/api/docs` and a machine-readable spec.
- Generate the Angular API client from the OpenAPI document as part of the documented build workflow. Treat generated code as output; do not hand-edit it.
- Keep generated Angular API clients under `src/client/api/generated/` and their maintained guide at `src/client/api/README.md`.
- Keep a public health endpoint separate from authenticated data routes. It returns only basic health/version information, never user data or secrets.
- Keep the API base URL configurable so the browser demo can point to a self-hosted service or compatible mock server. Configure CORS narrowly for intended origins.

## Data-source boundary

- Keep Local File, Web Storage, and Remote API selectable. The UI depends on a common data access contract, not on an implementation-specific service.
- Remote API uses the configured API client/base URL. The self-hosted NestJS API is the primary production API; `json-server` remains a development/test sandbox.
- Web Storage is browser/device-local and appropriate for demos and exploration. It is not server persistence.
- Local File in a browser uses explicit file upload/import and export/download. Future Electron native file browsing implements a platform adapter without changing domain behavior.
- Keep source switching explicit; do not silently copy data between sources. Validate imported data and provide clear errors.

## Persistence and future database support

- Controllers and application services depend on repository interfaces, not directly on JSON files or a database client.
- Use a JSON file repository adapter for backend persistence. Keep serialization, schema validation, atomic write behavior, and path configuration within that adapter.
- Keep API/domain models independent of JSON layout. Version stored data and centralize schema upgrades at the persistence boundary.
- Any database adapter must satisfy the same repository contracts. Keep the contracts proportionate to current use; do not add speculative abstractions unrelated to the supported persistence behavior.
- Document limits of JSON persistence (especially concurrent writes) and keep runtime files outside source control and image build context.

## Health status in the UI

- On startup and at a modest interval, check the selected Remote API's health endpoint with a timeout.
- Show an accessible status symbol and text for connected/healthy, unavailable, and checking states.
- Transient health failures must not crash the app or block Local File/Web Storage. Avoid exposing raw server errors or sensitive response data in the UI.
