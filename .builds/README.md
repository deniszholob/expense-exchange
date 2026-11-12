# Release builds

Each release version is stored in a directory named `expense-exchange-v<version>/`. All artifacts are placed directly in that directory:

- `expense-exchange-v<version>-docker-image.tar`: Docker image archive.
- `expense-exchange-v<version>-web/`: static Angular browser build.
- `screenshots/expense-exchange-screenshot-landscape-1280x720.png` and `screenshots/expense-exchange-screenshot-portrait-390x844.png`: Playwright screenshots captured during the web build.
- The build-only `screenshots/` captures also include 1920x1080 and 2560x1440 landscape screenshots.
- `expense-exchange-v<version>-linux-unpacked/`, `expense-exchange-v<version>-win-unpacked/`, or `expense-exchange-v<version>-macos-unpacked/`: Electron app directory for that platform.
- Installer files use `expense-exchange-v<version>-<os>-<arch>.<ext>` names.

These are generated outputs and stay out of source control.
