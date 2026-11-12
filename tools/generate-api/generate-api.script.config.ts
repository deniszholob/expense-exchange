// #region Configuration
export const GENERATE_API_SCRIPT_CONFIG = {
  title: 'Expense Exchange API',
  description: 'Self-hosted Expense Exchange API',
  version: '1.0.0',
  outputFile: '.dist/openapi.json',
  serverModulePath: '../../.dist/server/server/app.module.js',
} as const;
// #endregion
