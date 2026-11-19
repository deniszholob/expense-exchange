// #region Imports
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
// #endregion

// #region JSON File Utilities
export async function readJsonFile(filePath: string): Promise<unknown> {
  const serialized = await readFile(filePath, 'utf8');
  return JSON.parse(serialized) as unknown;
}

export async function writeJsonFileAtomically(
  filePath: string,
  value: unknown,
  options: { readonly mode?: number } = {},
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      ...(options.mode === undefined ? {} : { mode: options.mode }),
    });
    await rename(temporaryPath, filePath);
  } finally {
    await unlink(temporaryPath).catch((error: unknown) => {
      if (!isNodeErrorCode(error, 'ENOENT')) throw error;
    });
  }
}

export async function readOrCreateSecretFile(
  filePath: string,
): Promise<Buffer> {
  await mkdir(dirname(filePath), { recursive: true });
  try {
    return await readFile(filePath);
  } catch (error: unknown) {
    if (!isNodeErrorCode(error, 'ENOENT')) throw error;
  }

  const secret = randomBytes(48);
  try {
    await writeFile(filePath, secret, { flag: 'wx', mode: 0o600 });
    return secret;
  } catch (error: unknown) {
    if (!isNodeErrorCode(error, 'EEXIST')) throw error;
    return readFile(filePath);
  }
}

export function isNodeErrorCode(
  error: unknown,
  code: string,
): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
// #endregion
