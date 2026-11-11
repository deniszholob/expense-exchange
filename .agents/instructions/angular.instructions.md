---
applyTo: 'src/app/**,src/client/**'
description: 'Angular component, signal, template, accessibility, and styling standards'
---

# Angular Frontend

Apply to Angular components, directives, pipes, routes, services, templates, and stories.

## Component architecture

- Use standalone components, directives, and pipes. Do not add `standalone: true`; it is the default in the supported Angular versions.
- Use only APIs available in the Angular version installed in `package.json`; consult official Angular documentation when an API's behavior is uncertain.
- Prefer lazy-loaded feature routes. Keep components small and focused on one UI responsibility.
- Prefer extending/reusing existing components, services, models, utilities, and layouts. Add a new abstraction only when reuse would otherwise be awkward or leaky.
- Keep domain transformations in pure functions or domain services. Keep Angular-specific concerns such as signals, dependency injection, and rendering in Angular wrappers.
- Do not duplicate grouping, sorting, filtering, validation, or view-model mapping across components. Extract shared behavior and make all callers use it.
- Avoid circular dependencies. Extract shared types/state/logic into a neutral module rather than using lazy imports to conceal a cycle.
- Import symbols directly from the owning feature file. Do not add feature barrel files that only re-export other files or create passthrough exports.
- Do not add component inputs/outputs or runtime behavior solely to simplify a Storybook story. Use story wrappers, decorators, or mocks.

## Signals and state

- Use signals for synchronous UI state. Name signal-backed component properties with a `$` prefix (for example, `public readonly $selectedSource = signal(DataSource.WebStorage)`).
- Use `computed()` for derived state. Use `linkedSignal()` when derived state must be writable and stay synchronized with a source.
- Use `effect()` only for genuine side effects such as synchronizing with browser APIs or an external service. Do not use effects to copy state between signals or calculate derived state.
- Update signals with `set()` or `update()`; do not mutate their contained values in place.
- Keep transformations pure and predictable. Do not mirror the same state in signals, subjects, and ordinary fields without a clear ownership reason.
- Prefer signals/computed values for template-facing state rather than getters or methods called by the template.
- For RxJS subscriptions owned by a component/directive/service, provide teardown with `takeUntilDestroyed()` or an equally explicit lifecycle mechanism. A bare long-lived `subscribe()` is not acceptable.

## Component APIs and dependency injection

- Use signal-based `input()`, `output()`, `model()`, `viewChild()`, `viewChildren()`, `contentChild()`, and `contentChildren()` APIs instead of decorator equivalents.
- Prefix signal input properties with `$`, and use that same public property name in templates.
- Use `input.required<T>()` only when the parent must bind the input. For optional signal inputs, use `input<T>()` without explicitly passing `undefined`.
- Use `model()` for a single piece of shared writable state instead of a paired input and output.
- Do not alias input names. Use outputs with semantic names such as `valueChanged` or `closeRequested`, not native DOM event names.
- Use `inject()` for Angular dependency injection. Keep injectable services focused on a single responsibility and use `providedIn: 'root'` for application-wide singleton services.
- Use `ChangeDetectionStrategy.OnPush` for components. Prefer signals and immutable updates to keep rendering predictable.
- Put host attributes/listeners in the component/directive `host` metadata. Do not use `@HostBinding` or `@HostListener`.

## Forms

- Use Angular Signal Forms for new forms and when migrating existing forms.
- Do not introduce new template-driven forms or legacy reactive forms (`ngModel`, `FormGroup`, `FormControl`, `FormBuilder`, `formControl`, `formControlName`).
- Implement custom Signal Forms controls with `FormValueControl`; do not add `ControlValueAccessor` or `NG_VALUE_ACCESSOR` compatibility paths.
- Keep validation rules and messages centralized/reusable where they are shared. Validate again at API and persistence boundaries; client validation is not a security boundary.

## Templates

- Keep templates simple and declarative. Do not call component methods/getters or use arrow functions in templates.
- Use built-in control flow (`@if`, `@for`, `@switch`) instead of structural directives. Use `@empty` for empty list states.
- Use `@let` for repeated template expressions, especially when reading a signal more than once.
- Use `async` pipe for Observable values consumed directly by templates.
- Prefer `[class.name]`/`[style.property]` bindings for simple dynamic styling. Use `ngClass`/`ngStyle` only when they make complex conditional maps clearer.
- Keep Tailwind class strings complete and statically discoverable. Do not build class names by concatenating partial fragments.
- Use `NgOptimizedImage` for static image assets. It is not suitable for inline base64 data.
- Do not use `querySelector()`/`querySelectorAll()` for component behavior. Use typed Angular queries, directives, or component APIs.
- Use external template/style paths relative to the component TypeScript file.

## Visual system and accessibility

- Use Tailwind CSS v4 and the shared theme tokens. Prefer existing named tokens and reusable shared primitives over one-off values.
- Follow the dark finance design system: readable balances and tables, aligned financial values, consistent positive/negative/warning semantics, and restrained decoration.
- Use `@lucide/angular` icons consistently. Icon-only controls require accessible names.
- Meet WCAG 2.2 AA expectations: keyboard operation, visible focus, semantic structure, appropriate labels, contrast, focus management, and accessible status/error announcements. Do not rely on color alone.
- Prefer native semantic elements and buttons over clickable generic containers.
- Avoid focusable hidden form controls that can cause scroll jumps. Hidden controls must not remain keyboard-focusable.

## Stories and file layout

- Add a Storybook story for each reusable component, showing meaningful inputs/states and interactions.
- Keep stories representative and use synthetic, non-sensitive data. Do not expand production APIs solely to satisfy Storybook.
- Keep component files together in a clearly named feature folder, with the primary component, template, optional focused stylesheet, story, and tests adjacent as appropriate.
- Keep TypeScript regions consistent with `.agents/instructions/typescript.instructions.md`; do not leave empty regions.
