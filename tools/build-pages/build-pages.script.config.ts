// #region Types and Configuration
export interface BuildPagesScriptConfig {
  readonly browserBuildDirectory: string;
  readonly productionBuildScript: string;
}

export const BUILD_PAGES_SCRIPT_CONFIG: BuildPagesScriptConfig = {
  browserBuildDirectory: '.dist/client/browser',
  productionBuildScript: 'build:gh-prod',
};
// #endregion
