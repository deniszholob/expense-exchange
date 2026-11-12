# Application icons

Generate web icon variants with https://realfavicongenerator.net/ from the original `src/assets/expense-exchange-icon.png` artwork.

- `web/` contains browser favicon, installable app, and Safari pinned-tab assets. Angular copies these files to the browser build root.
- `desktop/` contains platform-specific Electron formats such as `.ico` and `.icns`.
- Keep original artwork and screenshots in `src/assets/`, outside the generated platform icon folders.

The web metadata lives in `src/client/index.html` and `src/client/meta/manifest.webmanifest`.
