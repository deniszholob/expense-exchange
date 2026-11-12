// #region Configuration
const APP_VERSION = process.env['npm_package_version'] ?? '0.1.0';

export const BUILD_SCREENSHOTS_SCRIPT_CONFIG = {
  browserBuildDirectory: `.builds/expense-exchange-v${APP_VERSION}/expense-exchange-v${APP_VERSION}-web/browser`,
  releaseDirectory: `.builds/expense-exchange-v${APP_VERSION}/screenshots`,
  sourceDirectory: 'src/assets/screenshots',
  browserAssetDirectory: `.builds/expense-exchange-v${APP_VERSION}/expense-exchange-v${APP_VERSION}-web/browser/assets/screenshots`,
  baseUrl: 'http://127.0.0.1:4557',
  serverPort: 4557,
  landscapeViewport: { width: 1280, height: 720 },
  mobileViewport: { width: 390, height: 844 },
  landscapeScreenshot: 'expense-exchange-screenshot-landscape-1280x720.png',
  portraitScreenshot: 'expense-exchange-screenshot-portrait-390x844.png',
  buildOnlyScreenshots: [
    {
      viewport: { width: 1920, height: 1080 },
      filename: 'expense-exchange-screenshot-landscape-1920x1080.png',
    },
    {
      viewport: { width: 2560, height: 1440 },
      filename: 'expense-exchange-screenshot-landscape-2560x1440.png',
    },
  ],
} as const;
// #endregion
