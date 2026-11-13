// #region Imports
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ZodType } from 'zod';
import {
  isNodeErrorCode,
  readJsonFile,
  writeJsonFileAtomically,
} from './json-file.utils.js';
// #endregion

// #region JSON Store
export class JsonStore<TStore> {
  private writeQueue: Promise<void> = Promise.resolve();
  private initialization: Promise<TStore> | undefined;

  public constructor(
    private readonly filePath: string,
    private readonly schema: ZodType<TStore>,
    private readonly createInitialStore: () => unknown,
  ) {}

  public async read(): Promise<TStore> {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      return this.schema.parse(await readJsonFile(this.filePath));
    } catch (error: unknown) {
      if (!isNodeErrorCode(error, 'ENOENT')) throw error;
      return this.initialize();
    }
  }

  public write(store: TStore): Promise<void> {
    return writeJsonFileAtomically(this.filePath, this.schema.parse(store));
  }

  public update<TOutput>(
    operation: (store: TStore) => Promise<TOutput> | TOutput,
  ): Promise<TOutput> {
    const result = this.writeQueue.then(async () => {
      const store = await this.read();
      const output = await operation(store);
      await this.write(store);
      return output;
    });
    this.writeQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private initialize(): Promise<TStore> {
    if (!this.initialization) {
      const initialization = (async () => {
        const store = this.schema.parse(this.createInitialStore());
        await this.write(store);
        return store;
      })();
      this.initialization = initialization;
      void initialization.catch(() => {
        if (this.initialization === initialization)
          this.initialization = undefined;
      });
    }
    return this.initialization;
  }
}
// #endregion
