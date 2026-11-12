# Repository tools

Each tool has its own folder and follows the `name.script.ts`, `name.script.config.ts`, and `name.script.sh` naming pattern. TypeScript files hold the tool logic and its configuration. The executable Bash file is only a convenience wrapper that changes to the repository root and launches the TypeScript script with the repository's supported Node runtime.

Run scripts from `package.json` for normal development workflows. The `.script.sh` files can also be run directly from an editor's “Run in Terminal” action.

## Desktop package targets

Electron Builder targets are configured in the root [`electron-builder.config.json`](../electron-builder.config.json), alongside `angular.json` and `Dockerfile`:

- Linux: AppImage.
- Windows: portable `.exe`.
- macOS: `.zip` containing the app bundle.

Unpacked directories, Linux `.deb`/`.rpm`, Snap, and installer targets are currently disabled. Add them to the relevant platform's `target` array in that config if distribution requirements change. Docker images use OCI metadata labels for title and version; the OCI image format has no standard graphical app-icon field.

Electron Builder uses the Electron distribution installed by the `electron` package (`electronDist` in the root config), avoiding a second Electron archive download during packaging. Electron Builder v26 downloads its AppImage tool bundle on demand and caches it locally; AppImage output therefore may make a network request on a clean build host. The target is retained because AppImage is a requested desktop format.
