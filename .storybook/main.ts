// #region Imports
import { autoTitleIndexer } from '@deniszholob/storybook-auto-titles';
import type { StorybookConfig } from '@storybook/angular';
// #endregion

const storyFiles = '*.@(mdx|stories.@(js|jsx|ts|tsx))';
// #region Configuration
const config: StorybookConfig = {
  stories: [`./**/${storyFiles}`, `../src/client/app/**/${storyFiles}`],
  experimental_indexers: autoTitleIndexer({
    stripPrefixes: ['src/client/app/'],
  }),
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/angular', options: {} },
  core: { disableTelemetry: true },
  staticDirs: [{ from: '../src/assets', to: '/assets' }],
};

export default config;
// #endregion
