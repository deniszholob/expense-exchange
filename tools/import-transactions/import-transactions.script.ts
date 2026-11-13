// #region Imports
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  TransactionSchema,
  TransactionType,
} from '../../src/util/transaction.schema.ts';
import { IMPORT_TRANSACTIONS_SCRIPT_CONFIG as CFG } from './import-transactions.script.config.ts';
// #endregion

// #region Constants and Types
type Transaction = ReturnType<typeof TransactionSchema.parse>;
type CsvRecord = Record<string, string>;
type TransactionStore = { version: 1; transactions: Transaction[] };
// #endregion

// #region Main
const args = process.argv.slice(2);
const inputPath = args[0] ?? CFG.inputPath;
const outputPath = args[1] ?? CFG.defaultOutputPath;
if (args.length > 2) {
  throw new Error(
    'Usage: tools/import-transactions/import-transactions.script.sh [input.csv] [output.json]',
  );
}

const records = parseCsv(await readFile(resolve(inputPath), 'utf8'));
const outputFile = resolve(outputPath);
const store = CFG.clearExistingTransactions
  ? { version: 1 as const, transactions: [] }
  : await readStore(outputFile);
const existingById = new Map(
  store.transactions.map((transaction) => [transaction.id, transaction]),
);
let imported = 0;
let skipped = 0;
let replaced = 0;

for (const [index, csvRow] of records.entries()) {
  const logicalRowNumber = index + 2;
  const parsed = parseRecord(csvRow.record, logicalRowNumber);
  if (!parsed.transaction) {
    if (parsed.reason) {
      skipped++;
      console.warn(`Skipped CSV row ${csvRow.lineNumber}: ${parsed.reason}`);
    }
    continue;
  }
  const transaction = parsed.transaction;
  if (existingById.has(transaction.id)) replaced++;
  else imported++;
  existingById.set(transaction.id, transaction);
}

const updatedStore: TransactionStore = {
  version: 1,
  transactions: [...existingById.values()].sort(
    (a, b) => a.postDate.localeCompare(b.postDate) || a.id.localeCompare(b.id),
  ),
};
await writeFile(outputFile, `${JSON.stringify(updatedStore, null, 2)}\n`);
console.info(
  `Imported ${imported}; refreshed ${replaced}; skipped ${skipped}. Store has ${updatedStore.transactions.length} transactions: ${outputFile}`,
);
// #endregion

// #region Helpers
function parseRecord(
  record: CsvRecord,
  logicalRowNumber: number,
): { transaction?: Transaction; reason?: string } {
  const name = record[CFG.headers.name]?.trim();
  const rawAmount = record[CFG.headers.amount]
    ?.trim()
    .replaceAll('$', '')
    .replaceAll(',', '');
  if (!name && !rawAmount) return {};
  if (!name) return { reason: 'missing transaction name' };
  if (!rawAmount || /TODO/i.test(rawAmount))
    return { reason: 'missing or non-numeric amount' };
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount))
    return { reason: `invalid amount ${rawAmount}` };
  if (amount === 0) return { reason: 'zero amount' };

  const beneficiaryCode = record[CFG.headers.beneficiaryCode] ?? '';
  if (!Object.hasOwn(CFG.beneficiaryMappings, beneficiaryCode))
    return {
      reason: `unsupported beneficiary code ${beneficiaryCode || '<blank>'}`,
    };
  const beneficiaryUserIds =
    CFG.beneficiaryMappings[
      beneficiaryCode as keyof typeof CFG.beneficiaryMappings
    ];
  const date = parseDate(record[CFG.headers.date]?.trim() ?? '');
  if (!date) return { reason: 'missing or invalid date' };

  const description = record[CFG.headers.description]?.trim();
  const transaction = TransactionSchema.parse({
    id: stableId(`${resolve(inputPath!)}:${logicalRowNumber}`),
    type: amount < 0 ? TransactionType.Refund : TransactionType.Expense,
    amount: Math.abs(amount),
    name,
    postDate: date,
    completeDate: date,
    targetUserId: CFG.targetUserId,
    beneficiaryUserIds: [...beneficiaryUserIds],
    ...(description ? { note: description } : {}),
  });
  return { transaction };
}

function parseDate(value: string): string | undefined {
  let year: number;
  let month: number;
  let day: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const yearFirst = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value);
  const monthFirst = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(value);
  if (iso || yearFirst) {
    const parts = (iso ?? yearFirst)!;
    year = Number(parts[1]);
    month = Number(parts[2]);
    day = Number(parts[3]);
  } else if (monthFirst) {
    month = Number(monthFirst[1]);
    day = Number(monthFirst[2]);
    year = Number(monthFirst[3]);
    if (year < 100) year += 2000;
  } else return undefined;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function stableId(value: string): string {
  const hash = createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 32)
    .split('');
  hash[12] = '5';
  hash[16] = ((Number.parseInt(hash[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = hash.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function readStore(path: string): Promise<TransactionStore> {
  try {
    const value: unknown = JSON.parse(await readFile(path, 'utf8'));
    if (
      typeof value !== 'object' ||
      value === null ||
      !('version' in value) ||
      value.version !== 1 ||
      !('transactions' in value) ||
      !Array.isArray(value.transactions)
    )
      throw new Error(`Invalid transaction store: ${path}`);
    return {
      version: 1,
      transactions: value.transactions.map((transaction) =>
        TransactionSchema.parse(transaction),
      ),
    };
  } catch (error) {
    if (isMissingFile(error)) return { version: 1, transactions: [] };
    throw error;
  }
}

function parseCsv(
  contents: string,
): { record: CsvRecord; lineNumber: number }[] {
  const rows: { cells: string[]; lineNumber: number }[] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let physicalLine = 1;
  let rowStartLine = 1;
  for (let index = 0; index < contents.length; index++) {
    const char = contents[index]!;
    if (quoted) {
      if (char === '"' && contents[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else if (char === '\n' || char === '\r') {
        field += '\n';
        if (char === '\r' && contents[index + 1] === '\n') index++;
        physicalLine++;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && contents[index + 1] === '\n') index++;
      row.push(field);
      if (row.some((cell) => cell.length > 0))
        rows.push({ cells: row, lineNumber: rowStartLine });
      row = [];
      field = '';
      physicalLine++;
      rowStartLine = physicalLine;
    } else field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.length > 0))
      rows.push({ cells: row, lineNumber: rowStartLine });
  }
  const headers = rows.shift()?.cells.map((header) => header.trim()) ?? [];
  if (!headers.length) throw new Error('CSV file has no header row');
  return rows.map(({ cells, lineNumber }) => ({
    lineNumber,
    record: Object.fromEntries(
      headers.map((header, index) => [header, cells[index] ?? '']),
    ),
  }));
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
// #endregion
