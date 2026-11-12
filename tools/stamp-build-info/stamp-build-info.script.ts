// #region Imports
import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { STAMP_BUILD_INFO_SCRIPT_CONFIG as CFG } from './stamp-build-info.script.config.ts';
// #endregion

// #region Types and Helpers
const BuildMetadataSchema = z.object({
  date: z.number().int().nonnegative(),
  version: z.string().min(1),
});

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
// #endregion

// #region Main
const indexFile =
  process.argv.slice(2).find((argument) => argument !== '--') ??
  CFG.defaultIndexFile;
const metadata = BuildMetadataSchema.parse(
  JSON.parse(await readFile(CFG.buildMetadataFile, 'utf8')),
);
const buildLabel = `v${metadata.version} - ${new Date(metadata.date).toISOString()} (${metadata.date})`;
const buildDate = new Date(metadata.date).toISOString();
const sourceHtml = await readFile(indexFile, 'utf8');
const metaTagPattern = new RegExp(
  `<meta\\s+name="${CFG.metaName}"\\s+content="[^"]*"\\s*\\/?>`,
);

if (!metaTagPattern.test(sourceHtml)) {
  throw new Error(`Build metadata placeholder was not found in ${indexFile}.`);
}

const stampedMetaTag = `<meta name="${CFG.metaName}" content="${escapeHtmlAttribute(buildLabel)}" />`;
const htmlWithMeta = sourceHtml.replace(metaTagPattern, stampedMetaTag);
if (
  !htmlWithMeta.includes('{{BUILD_VERSION}}') ||
  !htmlWithMeta.includes('{{BUILD_DATE}}')
) {
  throw new Error(`Build info placeholders were not found in ${indexFile}.`);
}

const htmlWithBuildInfo = htmlWithMeta
  .replaceAll('{{BUILD_VERSION}}', metadata.version)
  .replaceAll('{{BUILD_DATE}}', buildDate);
await writeFile(indexFile, htmlWithBuildInfo);
console.info(`Stamped ${indexFile} with ${buildLabel}`);
// #endregion
