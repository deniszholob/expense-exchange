// #region Configuration
const USER_ID_A = '5fc4ee05-f81e-4561-8e55-b88162956e40';
const USER_ID_B = 'd966e48c-8d52-4bb4-bea4-133baf62fd09';

export const IMPORT_TRANSACTIONS_SCRIPT_CONFIG = {
  defaultOutputPath: '.dist/data/transactions.json',
  inputPath: 'transactions.csv',
  clearExistingTransactions: false,
  targetUserId: USER_ID_A,
  headers: {
    date: 'Date',
    name: 'Name',
    amount: 'Amount',
    beneficiaryCode: 'Paid By',
    description: 'Description',
  },
  // Map source codes to any number of beneficiary IDs; keep these keys exact.
  beneficiaryMappings: {
    D: [USER_ID_A],
    S: [USER_ID_B],
    DS: [USER_ID_A, USER_ID_B],
    '': [USER_ID_A, USER_ID_B],
  },
} as const;
// #endregion
