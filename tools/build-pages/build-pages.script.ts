// #region Imports
import { copyFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { BUILD_PAGES_SCRIPT_CONFIG as CFG } from './build-pages.script.config.ts';
// #endregion

// #region Main
execFileSync('pnpm', ['run', CFG.productionBuildScript], { stdio: 'inherit' });
await copyFile(
  `${CFG.browserBuildDirectory}/index.html`,
  `${CFG.browserBuildDirectory}/404.html`,
);
const buildContents = await readdir(CFG.browserBuildDirectory);
console.info(`GitHub Pages build contents: ${buildContents.join(', ')}`);
// #endregion
