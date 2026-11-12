---
applyTo: '**/*.ts'
description: 'Strict TypeScript, enum, type-safety, and file-organization standards'
---

# TypeScript Standards

Apply to all TypeScript code in the repository, including Angular, NestJS, scripts, tests, and shared code.

## Source language and layout

- Author executable source, tooling, and configuration in TypeScript. Do not add JavaScript source files with `.js`, `.jsx`, `.mjs`, or `.cjs` extensions.
- Generated JavaScript may exist only inside ignored build output such as `.dist/` or `.builds/`; never use generated output as editable source.
- Keep application code in `src/client/`, `src/server/`, `src/desktop/`, or `src/util/`, grouped by domain. Keep TypeScript repository tools under `tools/`.
- Keep client styles under `src/client/`. Put static assets, screenshots, and shared brand icons under `src/assets/`.
- Keep each repository tool in its own `tools/<tool-name>/` folder, with the primary file named `<tool-name>.script.ts` and configuration named `<tool-name>.script.config.ts` when settings are needed.
- A matching executable `<tool-name>.script.sh` may be used as a terminal convenience wrapper. Keep it limited to locating the repository root and invoking the TypeScript script; tool logic belongs in TypeScript.

## Type safety

- Keep `strict` compiler options enabled. Fix type errors at the source instead of weakening compiler settings.
- Do not use `any`. Use `unknown` for values whose types are not yet established, then narrow or validate them before use.
- Define concrete domain and boundary types. Avoid loose index signatures where a proper model is possible.
- Prefer inference for obvious local values and explicit types for public APIs, function parameters/returns, dependency boundaries, and complex data transformations.
- Use `readonly` for values that should not be reassigned or mutated after creation.
- Declare class fields and methods with an explicit access modifier (`public`, `protected`, or `private`).
- Prefer property access with dot notation. Use bracket access when the key is genuinely dynamic or required by the domain.
- Avoid ad hoc indexed-access aliases such as `type Name = User['name']`; extract a concrete named type when it is part of an API.
- Avoid unsafe type assertions. Never cast through `any` to silence errors. Prefer guards, schema validation, `satisfies`, or well-typed constructors.
- Catch errors as `unknown` and narrow them before reading properties or returning messages.

## Enums and finite values

- Use string enums for finite domain states, modes, roles, options, and other identifiers that are persisted, passed between layers, or referenced across multiple call sites. Do not use string unions as a shortcut for these identifiers.
- Use PascalCase for enum names and members. Keep each string value equal to its member name unless a documented external protocol requires a different value.

  ```ts
  export enum ExpenseStatus {
    Pending = 'Pending',
    Settled = 'Settled',
  }
  ```

- Use string unions where they are the natural shape of a discriminated union or a small local type that is not a domain identifier. Do not turn every union into an enum mechanically.
- For exhaustive static mappings from an enum to labels, classes, icons, or behavior, use `Record<Enum, Value>` so adding an enum member creates a compile-time obligation.
- Do not duplicate enum value spellings in translation keys or persisted identifiers. Use the enum value as the stable identifier and keep display labels separate.

## Functions and control flow

- Keep functions small and single-purpose. Prefer module-level pure helpers over nested named functions.
- Avoid hidden side effects in mapping/filtering helpers. Keep transformations pure when practical.
- Promote repeated or non-obvious literals to named constants.
- Keep imports at the top of the file, including type-only imports. Avoid inline `import('module').Type` aliases; use normal top-level imports.
- Prefer explicit control flow and exhaustive handling of finite cases. Use `never` checks where useful to make discriminated-union handling exhaustive.
- Use `Promise` and Observable contracts consistently at boundaries; do not fire and forget asynchronous work without an explicit error/lifecycle strategy.

## Regions and file organization

- MUST use `// #region Section Name` and `// #endregion` comments in every TypeScript file to group its meaningful logical sections.
- Keep region names descriptive and consistent. Do not create empty regions or split a short file into unnecessary sections; a short file can use a single region for its contents.
- For classes, use a consistent order where the sections apply: constants; inputs/outputs or injected dependencies; signals/observables and properties; constructor; lifecycle hooks; public methods; private methods; module-level helpers.
- Keep one primary exported construct per file when practical. Name files and folders after the primary symbol and keep related tests, mocks, and stories adjacent according to the feature's established layout.
- Avoid feature-local barrel files that only re-export symbols from other feature files. Import from the owning module directly. Use a deliberate shared-model entry point only when it defines a real public boundary.

## Imports, dependencies, and formatting

- Use type-only imports when a symbol is only used as a type.
- Avoid circular dependencies. Move shared types or pure logic to a neutral module instead of hiding cycles with dynamic imports.
- Reuse existing utilities and dependencies before adding new abstractions or packages.
- Follow ESLint and Prettier configuration. Do not hand-format around configured rules or disable rules locally without a clear reason.
