// #region Imports
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';
import { BUNDLE_SERVER_SCRIPT_CONFIG as CFG } from './bundle-server.script.config.ts';
// #endregion

// #region Main
await rm(CFG.outputDirectory, { recursive: true, force: true });
await mkdir(CFG.outputDirectory, { recursive: true });

const bundleResult = await build({
  bundle: true,
  entryPoints: [CFG.entryPoint],
  external: [...CFG.externalPackages],
  format: 'cjs',
  platform: 'node',
  sourcemap: false,
  write: false,
});
const serverCode = bundleResult.outputFiles[0]?.text;
if (serverCode === undefined) {
  throw new Error(
    'The NestJS server bundle did not produce JavaScript output.',
  );
}

const bundledCode = serverCode
  .replace(
    /var (import_meta\d*) = \{\};/g,
    'var $1 = { url: require("node:url").pathToFileURL(__filename).href };',
  )
  .replace(
    /require\d*\(["']swagger-ui-dist\/absolute-path\.js["']\)\(\)/g,
    'require("node:path").resolve(process.env.DIST_DIR ?? ".dist", "server-bundle/swagger-ui")',
  );
await writeFile(
  resolve(CFG.outputDirectory, 'server.cjs'),
  bundledCode,
  'utf8',
);

const require = createRequire(import.meta.url);
const swaggerPackageDirectory = dirname(require.resolve('@nestjs/swagger'));
const swaggerUiDirectory = resolve(
  swaggerPackageDirectory,
  '..',
  '..',
  '..',
  'swagger-ui-dist',
);
await cp(
  swaggerUiDirectory,
  resolve(CFG.outputDirectory, CFG.swaggerUiDirectoryName),
  {
    dereference: true,
    recursive: true,
  },
);
// #endregion
