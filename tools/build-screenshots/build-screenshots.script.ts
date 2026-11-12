// #region Imports
import { createReadStream } from 'node:fs';
import { access, copyFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { BUILD_SCREENSHOTS_SCRIPT_CONFIG as CFG } from './build-screenshots.script.config.ts';
// #endregion

// #region Helpers
function delay(durationMs: number): Promise<void> {
  return new Promise((resolveDelay): void => {
    setTimeout(resolveDelay, durationMs);
  });
}

async function waitForWebServer(): Promise<boolean> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(CFG.baseUrl);
      if (response.ok) {
        return true;
      }
    } catch {
      await delay(250);
    }
  }
  return false;
}

function browserIsNotInstalled(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Executable doesn't exist") ||
      error.message.includes('browserType.launch'))
  );
}

function contentTypeForFile(path: string): string {
  switch (extname(path)) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.ico':
      return 'image/x-icon';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
    case '.webmanifest':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}
// #endregion

// #region Main
const browserBuildDirectory = resolve(CFG.browserBuildDirectory);
await access(join(browserBuildDirectory, 'index.html'));
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url ?? '/', CFG.baseUrl).pathname,
  );
  const requestedFile = resolve(browserBuildDirectory, `.${pathname}`);
  const candidate = requestedFile.startsWith(`${browserBuildDirectory}/`)
    ? requestedFile
    : join(browserBuildDirectory, 'index.html');

  try {
    const file = (await stat(candidate)).isFile()
      ? candidate
      : join(browserBuildDirectory, 'index.html');
    response.writeHead(200, { 'content-type': contentTypeForFile(file) });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(CFG.serverPort, '127.0.0.1');

let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  if (!(await waitForWebServer())) {
    throw new Error('The temporary web server did not become ready.');
  }

  try {
    const systemChromium = '/usr/bin/chromium';
    browser = await chromium.launch({
      headless: true,
      ...(process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'] !== undefined
        ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'] }
        : existsSync(systemChromium)
          ? { executablePath: systemChromium }
          : {}),
    });
  } catch (error: unknown) {
    if (browserIsNotInstalled(error)) {
      console.warn(
        'Screenshot capture skipped: install Chromium with `pnpm run playwright:install`.',
      );
    } else {
      throw error;
    }
  }

  if (browser !== undefined) {
    await Promise.all([
      mkdir(CFG.releaseDirectory, { recursive: true }),
      mkdir(CFG.sourceDirectory, { recursive: true }),
      mkdir(CFG.browserAssetDirectory, { recursive: true }),
    ]);
    const page = await browser.newPage({ viewport: CFG.landscapeViewport });
    await page.goto(CFG.baseUrl, { waitUntil: 'networkidle' });
    await page.locator('app-page-layout').waitFor({ state: 'visible' });
    await page.getByText('Data Source', { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: resolve(CFG.releaseDirectory, CFG.landscapeScreenshot),
      animations: 'disabled',
    });

    await page.setViewportSize(CFG.mobileViewport);
    await page.screenshot({
      path: resolve(CFG.releaseDirectory, CFG.portraitScreenshot),
      animations: 'disabled',
    });
    await Promise.all(
      [CFG.landscapeScreenshot, CFG.portraitScreenshot].flatMap(
        (screenshot) => {
          const releasePath = resolve(CFG.releaseDirectory, screenshot);
          return [
            copyFile(releasePath, resolve(CFG.sourceDirectory, screenshot)),
            copyFile(
              releasePath,
              resolve(CFG.browserAssetDirectory, screenshot),
            ),
          ];
        },
      ),
    );
    for (const screenshot of CFG.buildOnlyScreenshots) {
      await page.setViewportSize(screenshot.viewport);
      await page.screenshot({
        path: resolve(CFG.releaseDirectory, screenshot.filename),
        animations: 'disabled',
      });
    }
    console.info(
      `Source screenshots and four release screenshots saved to ${CFG.sourceDirectory} and ${CFG.releaseDirectory}`,
    );
  }
} finally {
  await browser?.close();
  server.close();
}
// #endregion
