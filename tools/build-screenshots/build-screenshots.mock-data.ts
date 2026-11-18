// #region Screenshot Mock Data
export function initializeScreenshotMockData(): void {
  const today = new Date();
  const dateDaysAgo = (daysAgo: number): string => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  };
  const transactions = [
    {
      id: 'screenshot-rent',
      type: 'Expense',
      name: 'Monthly rent',
      amount: 1850,
      postDate: dateDaysAgo(12),
      completeDate: dateDaysAgo(12),
      targetParticipantId: 'local-user',
      beneficiaryParticipantIds: ['local-user', 'screenshot-bob'],
    },
    {
      id: 'screenshot-groceries',
      type: 'Expense',
      name: 'Groceries',
      amount: 128.45,
      postDate: dateDaysAgo(5),
      completeDate: dateDaysAgo(5),
      targetParticipantId: 'screenshot-bob',
      beneficiaryParticipantIds: ['local-user', 'screenshot-bob'],
    },
    {
      id: 'screenshot-dinner',
      type: 'Expense',
      name: 'Dinner with friends',
      amount: 86.2,
      postDate: dateDaysAgo(3),
      completeDate: dateDaysAgo(3),
      targetParticipantId: 'local-user',
      beneficiaryParticipantIds: ['local-user', 'screenshot-bob'],
    },
    {
      id: 'screenshot-income',
      type: 'Income',
      name: 'Freelance project payment',
      amount: 1250,
      postDate: dateDaysAgo(2),
      completeDate: dateDaysAgo(2),
      targetParticipantId: 'local-user',
      beneficiaryParticipantIds: ['local-user'],
    },
    {
      id: 'screenshot-refund',
      type: 'Refund',
      name: 'Returned household item',
      amount: 24.99,
      postDate: dateDaysAgo(1),
      completeDate: dateDaysAgo(1),
      targetParticipantId: 'local-user',
      beneficiaryParticipantIds: ['local-user', 'screenshot-bob'],
      linkedTransactionId: 'screenshot-groceries',
    },
  ];

  window.localStorage.setItem('expense-exchange.data-source', 'Local');
  window.localStorage.setItem(
    'expense-exchange.local-data',
    JSON.stringify({
      version: 3,
      users: [
        { id: 'local-user', name: 'Alice', color: 'Blue' },
        { id: 'screenshot-bob', name: 'Bob', color: 'Emerald' },
      ],
      availableUsers: [
        { id: 'local-user', name: 'Alice', color: 'Blue' },
        { id: 'screenshot-bob', name: 'Bob', color: 'Emerald' },
      ],
      externalParticipants: [],
      transactions,
    }),
  );
}
// #endregion
