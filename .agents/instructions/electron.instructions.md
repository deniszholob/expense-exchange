---
applyTo: 'src/desktop/**,**/*electron*'
description: 'Electron main, preload, renderer boundary, IPC safety, and packaging rules'
---

# Electron Frontend Wrapper

Apply to Electron shell, build, and package configuration.

## Application boundary

- Electron is a desktop wrapper around the Angular frontend. Build and packaging scripts are part of the supported project toolchain.
- Keep the supported platform target matrix explicit in the root Electron Builder config beside other build configuration. Keep target formats and output names documented alongside the build commands.
- Use the Electron distribution installed from the declared `electron` dependency for packaging. Keep Electron and Electron Builder versions in `package.json` and the lockfile; do not rely on a globally installed packager.
- Use shared brand icons from `src/assets/icons/` and platform-appropriate icon formats in desktop packaging.
- Use the same Remote API configuration so desktop users can connect to a self-hosted Expense Exchange server.
- Keep Angular data access behind platform-neutral interfaces. Electron-specific code belongs in a narrow preload/bridge boundary, not domain services.
- Use context isolation, disable Node integration in the renderer, and expose only the minimum bridge methods needed.
- Provide local-file access through platform-specific implementations: browser builds use user-mediated upload/import and download/export; Electron may use native file selection through the validated preload bridge.
- Keep Electron development, compilation, and packaging commands documented. Platform-specific signing and release distribution must follow the active release requirements.

## Security and data

- Do not expose filesystem, shell, or unrestricted IPC capabilities to renderer content.
- Validate IPC payloads and use explicit channels/types.
- Electron user data must not be placed in the repository or packaged application resources.
- Never commit Electron credentials or secrets.
