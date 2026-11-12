// #region Imports
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DATE_PATCH_SCRIPT_CONFIG as CFG } from './date-patch.script.config.ts';
// #endregion

// #region Main
const buildDate = Date.now();
const buildVersion = process.env['npm_package_version'] ?? '0.0.0';
const contents = `// === Auto Generated during deployment build === //

/** MS since UNIX epoch - can use with angular date pipe */
export const APP_BUILD_DATE: number = ${buildDate};
/** Version extracted from package.json */
export const APP_BUILD_VERSION: string = '${buildVersion}';
`;

await writeFile(CFG.applicationBuildFile, contents);
await mkdir(dirname(CFG.buildMetadataFile), { recursive: true });
await writeFile(
  CFG.buildMetadataFile,
  `${JSON.stringify({ date: buildDate, version: buildVersion }, null, 2)}\n`,
);
console.info(
  `Build info updated: v${buildVersion} - ${new Date(buildDate).toISOString()}`,
);
// #endregion
