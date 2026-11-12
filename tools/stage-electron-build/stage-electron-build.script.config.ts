// #region Types and Configuration
export const ELECTRON_PLATFORMS = {
  Linux: 'linux',
  MacOS: 'mac',
  Windows: 'win',
} as const;
export type ElectronPlatform =
  (typeof ELECTRON_PLATFORMS)[keyof typeof ELECTRON_PLATFORMS];

export const ELECTRON_UNPACKED_DIRECTORIES: Record<ElectronPlatform, string> = {
  [ELECTRON_PLATFORMS.Linux]: 'linux-unpacked',
  [ELECTRON_PLATFORMS.MacOS]: 'mac',
  [ELECTRON_PLATFORMS.Windows]: 'win-unpacked',
};
export const ELECTRON_UNPACKED_RELEASE_NAMES: Record<ElectronPlatform, string> =
  {
    [ELECTRON_PLATFORMS.Linux]: 'linux-unpacked',
    [ELECTRON_PLATFORMS.MacOS]: 'macos-unpacked',
    [ELECTRON_PLATFORMS.Windows]: 'win-unpacked',
  };

export const STAGE_ELECTRON_BUILD_SCRIPT_CONFIG = {
  releaseDirectory: `.builds/expense-exchange-v${process.env['npm_package_version'] ?? '0.1.0'}`,
  electronOutputDirectory: '.dist/electron',
  version: process.env['npm_package_version'] ?? '0.1.0',
} as const;
// #endregion
