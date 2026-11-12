// #region Imports
import { defineConfig } from 'orval';
// #endregion

// #region Configuration
export default defineConfig({
  expenseExchange: {
    input: './.dist/openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/client/api/generated/expense-exchange-api.ts',
      client: 'angular',
      clean: true,
      override: {
        angular: {
          baseUrl: { apiId: 'ExpenseExchange' },
          retrievalClient: 'both',
        },
      },
    },
  },
});
// #endregion
