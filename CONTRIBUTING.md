# To contribute

**If you are working on an existing issue, please claim it with your comment, so there is no duplicate work.**

## What you will need before you begin:

1. Ensure [Node.js](https://nodejs.org/) version 22.22.3 or later is installed on your system.
2. Install [VSCode](https://code.visualstudio.com/) v1.74 or later
3. Install [pnpm](https://pnpm.io/) `npm install -g pnpm`
4. Clone the repository using git cli or ui like github desktop/sourcetree/gitkraken etc...
5. Open the cloned folder using VSCode and **install recommended extensions**
6. Run `pnpm run i` in the folder that you've just cloned to ensure you have all dependencies that are needed for development.
7. Run `pnpm run dev:client` to start the Angular dev server.

## Hidden Files in VSCode

Some files are hidden in vscode by default, see the `files.exclude` option in the [settings file](.vscode/settings.json)

There is a [recommended extension](.vscode/extensions.json) `adrianwilczynski.toggle-hidden` that allows to easily toggle hidden files on and off

## Storybook

You can reference any of the existing components in the storybook instance

- Run storybook via `pnpm run storybook` command
- You can then browse the list of components and use the docs to help you use them

## Repository structure

- See [AGENTS.md](AGENTS.md) for the repository map and `.agents/instructions/` for implementation standards.
- Use `pnpm run dev:client`, `pnpm run dev:server`, `pnpm run dev:storybook`, and `pnpm run dev:json-server` for development. Run `pnpm run build` for all build targets, or choose `pnpm run build:web`, `pnpm run build:desktop`, and `pnpm run build:docker` individually.
- `pnpm run build:web` refreshes 1280x720 and 390x844 screenshots. See [.builds/README.md](.builds/README.md) for release output locations. Playwright Chromium must be installed (`pnpm run playwright:install`) or available as system Chromium. Docker compilation and bundling happen on the host before the Docker image is assembled.
- Use `pnpm run build:desktop:linux`, `pnpm run build:desktop:windows`, or `pnpm run build:desktop:macos` to select a desktop target. macOS code signing requires a macOS host.
- Run `pnpm run dev:client`, `pnpm run dev:server`, `pnpm run dev:storybook`, or `pnpm run dev:json-server` for local development. `pnpm run dev` starts the client.
- Build output is generated and ignored by Git. Do not edit output files directly.

Executable source and repository configuration must be authored in TypeScript. Do not add `.js`, `.jsx`, `.mjs`, or `.cjs` files; the only JavaScript files are compiler-generated output in ignored build directories. Run `pnpm run check:typescript-only` to check this rule.

## Writing code

Read the applicable guide in `.agents/instructions/` before changing a subsystem. The recommended Angular Files Generator extension is available for scaffolding Angular files.

## Steps to follow when your work is ready:

When your work is done:

1. Run `pnpm run build`.
2. After a successful build, make a commit and push your changes. If you're fixing a existing issue: be sure to link to that issue in the git commit message, like so: `Closes #issueNumberThatGetsFixed`.
3. Create a new Pull Request.
4. Write a good description of the changes this pull-request will make.
5. You must provide screenshots if there is a visual change.

## Debug

- If you get an error with precommit hooks (Mac/Linux), see: https://stackoverflow.com/a/72279243

## Docker smoke check

Build the self-hosted image, start it with an isolated temporary data mount, and check both the API and UI:

```sh
pnpm run build:docker
docker run --detach --name expense-exchange-validation --publish 127.0.0.1:4310:3000 --mount type=tmpfs,destination=/app/data expense-exchange:0.1.0
curl --fail --silent --show-error http://127.0.0.1:4310/api/health
curl --fail --silent --show-error --output /dev/null --write-out 'UI HTTP %{http_code}\n' http://127.0.0.1:4310/
docker stop expense-exchange-validation
docker rm expense-exchange-validation
```

The same check can be run with `pnpm run smoke:docker`; it checks the API health endpoint, UI, shared app icon, Swagger page, and OpenAPI JSON, then removes its validation container. Change the host port if `4310` is already in use.

## Versions and changelog

Use semantic versions in `package.json` and record user-facing changes in [CHANGELOG.md](./CHANGELOG.md). Run `pnpm run version:patch`, `pnpm run version:minor`, or `pnpm run version:major` to update the package version; review and update the changelog as part of preparing a release. Web, Docker, and Electron package outputs include the package name and version.
