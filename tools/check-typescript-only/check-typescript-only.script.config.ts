// #region Configuration
export const CHECK_TYPESCRIPT_ONLY_SCRIPT_CONFIG = {
  excludedDirectories: new Set([
    '.builds',
    '.dev',
    '.dist',
    '.git',
    'dist',
    'dist-storybook',
    '.storybook/cache',
    'node_modules',
  ]),
  forbiddenExtensions: new Set(['.js', '.jsx', '.mjs', '.cjs']),
} as const;
// #endregion
