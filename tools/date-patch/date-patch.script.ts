// #region Imports
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DATE_PATCH_SCRIPT_CONFIG as CFG } from './date-patch.script.config.ts';
// #endregion

// #region Main
const buildDate = Date.now();
const buildVersion = process.env['npm_package_version'] ?? '0.0.0';
const generatedApplicationBuild = `// === Auto Generated during deployment build === //

// #region Build Metadata
/** Milliseconds since the Unix epoch; Can Use with Angular date pipe; production builds replace this module. */
export const APP_BUILD_DATE: number = ${buildDate};
/** Production builds replace this source default with package.json version metadata. */
export const APP_BUILD_VERSION: string = '${buildVersion}';
// #endregion
`;

await mkdir(dirname(CFG.buildMetadataFile), { recursive: true });
await writeFile(CFG.generatedApplicationBuildFile, generatedApplicationBuild);
await writeFile(
  CFG.buildMetadataFile,
  `${JSON.stringify({ date: buildDate, version: buildVersion }, null, 2)}\n`,
);
console.info(
  `Build info updated: v${buildVersion} - ${new Date(buildDate).toISOString()}`,
);
// #endregion
