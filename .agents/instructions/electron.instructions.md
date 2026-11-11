---
applyTo: 'electron/**,src/electron/**,**/*electron*'
description: 'Electron main, preload, renderer boundary, IPC safety, and packaging rules'
---

# Electron Frontend Wrapper

Apply to Electron shell, build, and package configuration.

## Application boundary

- Electron is a desktop wrapper around the Angular frontend. Build and packaging scripts are part of the supported project toolchain.
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
