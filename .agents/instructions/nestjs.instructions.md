---
applyTo: 'src/server/**'
description: 'NestJS module, API, validation, persistence, and security standards'
---

# NestJS Backend

Apply to NestJS modules, controllers, providers, API schemas, persistence adapters, and server configuration.

## Module and application structure

- Organize by domain capability. Each module owns its controllers, application services, and providers; export only what other modules need.
- Keep controllers thin: parse/validate transport input, call an application service, and map the result to a public response DTO.
- Put use-case orchestration in application services. Keep reusable domain rules in domain functions/services and I/O in adapters.
- Keep domain logic independent from Nest decorators, Express request/response objects, and filesystem/database APIs.
- Use constructor injection for Nest providers. Avoid service locators and global mutable state.
- Give providers one clear responsibility. Do not add layers that merely forward calls without enforcing a useful boundary.
- Use explicit request/response DTOs at HTTP boundaries. Never serialize persistence entities directly when they contain internal fields.

## TypeScript and async behavior

- Follow `.agents/instructions/typescript.instructions.md` for strict typing, string enums, regions, imports, and error narrowing.
- For Node ESM server-side relative imports, include the `.js` specifier so TypeScript resolves the source file and Node resolves the emitted module. Extensionless imports can work in bundlers but fail when Node loads emitted ESM directly; this repository encountered that failure during OpenAPI generation after switching server resolution to `Bundler`. The server now uses `NodeNext` and `.js` specifiers.
- Use `async`/`await` consistently for promise-based I/O. Await writes and handle failures; do not silently detach asynchronous tasks.
- Avoid blocking filesystem or CPU-heavy work in request handlers. Keep JSON I/O bounded and asynchronous.
- Do not return `any`, raw exceptions, stack traces, internal paths, secrets, or implementation details to clients.

## Validation, errors, and HTTP behavior

- Validate every request body, path parameter, and query parameter at the API boundary using shared Zod schemas where applicable.
- Derive TypeScript types from the schemas instead of maintaining duplicate validators and interfaces.
- Return stable, documented HTTP status codes and a consistent error shape. Translate expected domain failures into appropriate HTTP exceptions at the transport boundary.
- Keep unexpected errors in centralized exception handling. Log only safe diagnostic context and never include credentials, tokens, cookies, or complete expense records.
- Configure request size limits and validation for imported or large data payloads.

## API documentation and generated client

- Generate Swagger/OpenAPI from the running Nest application and shared schemas. Keep interactive docs at `/api/docs` and the JSON spec aligned with the implemented API.
- Document request and response bodies with named Swagger DTO classes. Use those classes in `@ApiBody()` and response decorators; use `isArray: true` for array responses and named DTO properties for nested objects. This ensures OpenAPI emits reusable component schemas and generated clients share stable, meaningful model names instead of creating a separate anonymous type for each operation.
- When multiple DTOs expose the same domain enum, document it once in OpenAPI with its canonical enum name so API generation reuses one enum type rather than creating duplicate DTO-scoped enums.
- Do not pass inline schemas or schemas converted from Zod (for example, `z.toJSONSchema()`) into Swagger decorators for API bodies or responses. Keep shared Zod schemas as the runtime validation source at the request boundary, and keep DTO fields aligned with their inferred types (use `implements` where the shape matches). Give request and response DTOs distinct names when their contracts differ.
- Add endpoint summaries, operation descriptions, response schemas, and error responses so the spec is useful to both people and generators.
- Generate the Angular API client from the OpenAPI document through the repository's documented script. Do not hand-edit generated client/spec output.
- Keep the API base URL configurable for the browser demo and desktop wrapper. Configure CORS for explicit origins; do not use unrestricted origins with credentials.
- Maintain a public health endpoint for client connectivity checks. Return only minimal health status and optional non-sensitive version metadata.

## Authentication and authorization

- Support the defined admin and regular-user roles. Apply authentication and role checks to all protected operations, especially writes and user management.
- Store password hashes only. Use a maintained password-hashing algorithm/library; never log or return passwords or hashes.
- Use HTTP-only session cookies with appropriate SameSite and Secure behavior for the deployment scheme.
- Require a persistent production session secret from runtime configuration. Do not commit secrets, ship default credentials, or use a process-random secret that invalidates sessions after restart.
- Provision the initial administrator through an explicit, one-time setup path. Prevent setup from creating additional administrators after initialization unless authorized.
- Keep public health/docs responses free of private account or expense data.

## Persistence and transactions

- Application services depend on repository interfaces; controllers must never access files or database clients directly.
- Keep the JSON repository as an adapter. It owns path resolution, async file access, serialization, schema validation, atomic replacement, and storage-version handling.
- Store runtime JSON outside the source tree and Docker build context. Treat malformed, missing, or incompatible persisted data explicitly; do not silently overwrite user data.
- Keep repository contracts independent of the JSON encoding so a database adapter can implement them without changing controllers or domain use cases.
- Coordinate writes so concurrent requests cannot corrupt or lose updates. Document the supported single-instance/concurrency model.
- Keep public DTOs distinct from persistence records, especially for password hashes, roles, and internal identifiers.

## Configuration and lifecycle

- Read configuration through typed, validated configuration providers. Fail startup for missing required production secrets/configuration with a clear message that does not print the secret.
- Keep development defaults safe and non-sensitive. Do not use real data or credentials in defaults.
- Implement graceful shutdown for server resources. Keep health status accurate during startup/shutdown and dependency failures.
- Use structured logging with request correlation where available, but redact sensitive fields and avoid logging full request/response bodies.

## Serving the Angular application

There are two supported NestJS/Express integration points for static files:

- `ServeStaticModule.forRoot()` in a Nest module expresses static hosting as module configuration. `rootPath` is fixed when the module is initialized, and `exclude` can keep API routes out of the static handler. This is a good fit when the directory is stable relative to the compiled module and the application uses the module's conventional routing setup.
- `app.useStaticAssets()` in `main.ts` configures the Express adapter during bootstrap. It is Express-specific, but can use runtime configuration such as `DIST_DIR`, making the selected distribution path explicit and easy to coordinate with other bootstrap paths such as Swagger's bundled UI assets.

Keep static serving in one place rather than registering both handlers. Prefer the bootstrap approach when deployment output directories are configurable at runtime; prefer `ServeStaticModule` when the path is a stable module-level setting and the application benefits from keeping static hosting in Nest module configuration. In either case, keep API routes excluded from the SPA/static fallback and verify paths against the compiled bundle layout, not only the source tree.
