// #region Imports
import { access, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ELECTRON_PLATFORMS,
  ELECTRON_UNPACKED_DIRECTORIES,
  ELECTRON_UNPACKED_RELEASE_NAMES,
  type ElectronPlatform,
  STAGE_ELECTRON_BUILD_SCRIPT_CONFIG as CFG,
} from './stage-electron-build.script.config.ts';
// #endregion

// #region Platform Helpers
function getCurrentElectronPlatform(): ElectronPlatform {
  switch (process.platform) {
    case 'linux':
      return ELECTRON_PLATFORMS.Linux;
    case 'darwin':
      return ELECTRON_PLATFORMS.MacOS;
    case 'win32':
      return ELECTRON_PLATFORMS.Windows;
    default:
      throw new Error(
        `Electron packaging is unsupported on ${process.platform}.`,
      );
  }
}

function parseElectronPlatform(value: string | undefined): ElectronPlatform {
  switch (value) {
    case undefined:
      return getCurrentElectronPlatform();
    case ELECTRON_PLATFORMS.Linux:
      return ELECTRON_PLATFORMS.Linux;
    case ELECTRON_PLATFORMS.MacOS:
      return ELECTRON_PLATFORMS.MacOS;
    case ELECTRON_PLATFORMS.Windows:
      return ELECTRON_PLATFORMS.Windows;
    default:
      throw new Error(`Unknown Electron platform: ${value}`);
  }
}

async function replacePath(source: string, destination: string): Promise<void> {
  await rm(destination, { recursive: true, force: true });
  await rename(source, destination);
}
// #endregion

// #region Main
const isDirectoryBuild = process.argv[2] === '--dir';
const platform = parseElectronPlatform(process.argv[isDirectoryBuild ? 3 : 2]);
await access(CFG.electronOutputDirectory);
await mkdir(CFG.releaseDirectory, { recursive: true });

if (isDirectoryBuild) {
  const unpackedDirectory = ELECTRON_UNPACKED_DIRECTORIES[platform];
  const sourcePath = join(CFG.electronOutputDirectory, unpackedDirectory);
  const destinationPath = join(
    CFG.releaseDirectory,
    `expense-exchange-v${CFG.version}-${ELECTRON_UNPACKED_RELEASE_NAMES[platform]}`,
  );
  await access(sourcePath);
  await replacePath(sourcePath, destinationPath);
} else {
  const entries = await readdir(CFG.electronOutputDirectory, {
    withFileTypes: true,
  });
  for (const entry of entries) {
    if (
      entry.name === 'builder-debug.yml' ||
      entry.name.startsWith('__') ||
      entry.name.startsWith('latest-') ||
      (entry.isDirectory() &&
        entry.name === ELECTRON_UNPACKED_DIRECTORIES[platform])
    ) {
      continue;
    }
    const sourcePath = join(CFG.electronOutputDirectory, entry.name);
    const destinationPath = join(CFG.releaseDirectory, entry.name);
    await replacePath(sourcePath, destinationPath);
  }
}

await rm(CFG.electronOutputDirectory, { recursive: true, force: true });
// #endregion
