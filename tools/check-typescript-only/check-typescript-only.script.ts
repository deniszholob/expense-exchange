// #region Imports
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { CHECK_TYPESCRIPT_ONLY_SCRIPT_CONFIG as CFG } from './check-typescript-only.script.config.ts';
// #endregion

// #region File Discovery
async function findJavaScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedResults = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (
          CFG.excludedDirectories.has(path) ||
          CFG.excludedDirectories.has(entry.name)
        ) {
          return [];
        }
        return findJavaScriptFiles(path);
      }
      return CFG.forbiddenExtensions.has(extname(entry.name)) ? [path] : [];
    }),
  );

  return nestedResults.flat();
}
// #endregion

// #region Main
const files = await findJavaScriptFiles('.');
if (files.length > 0) {
  console.error(`JavaScript files are not allowed:\n${files.join('\n')}`);
  process.exitCode = 1;
} else {
  console.info('TypeScript-only source check passed.');
}
// #endregion
