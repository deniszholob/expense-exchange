# Generated API clients

This README documents the generated OpenAPI client artifacts in
`src/client/api/generated/`. Orval clears and regenerates that directory.
Do not manually edit, add, or remove generated files there.
Changes will be overwritten the next time the API client is generated.

The source of truth is the NestJS controllers and DTOs in
`src/server/`. The generation flow is:

```text
NestJS controllers and DTOs
        -> OpenAPI document
        -> Orval
        -> Angular HttpClient services and httpResource functions
```

From the repository root, regenerate the clients with:

```bash
pnpm run generate:api
```

This builds the server, writes the OpenAPI document to `.dist/openapi.json`,
and regenerates the Angular clients in `src/client/api/generated/`.

## Usage

Inject generated services directly into Angular components or services. Do not
create another API wrapper or façade.

### Reads with `httpResource()`

Use the generated resource function for signal-based reads:

```ts
import { Injectable } from '@angular/core';

import { expenseControllerGetExpensesResource } from 'src/client/api/generated/expenses/expenses.resource';

@Injectable({ providedIn: 'root' })
export class ExampleState {
  public readonly expensesResource = expenseControllerGetExpensesResource({
    defaultValue: [],
  });

  public reload(): void {
    this.expensesResource.reload();
  }
}
```

Read the resource through its signals in the Angular template. Use
`hasValue()` before reading the resolved value:

```html
@if (expensesResource.isLoading()) {
<p>Loading expenses...</p>
} @else if (expensesResource.error(); as error) {
<p>Unable to load expenses: {{ error.message }}</p>
} @else if (expensesResource.hasValue()) {
<p>Expenses: {{ expensesResource.value().length }}</p>
}
```

### Mutations with generated `HttpClient` services

Generated services return RxJS observables. Convert them to promises when an
imperative event handler needs to await the request:

```ts
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { CreateExpenseDto, ExpenseDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import { ExpensesService } from 'src/client/api/generated/expenses/expenses.service';

@Injectable({ providedIn: 'root' })
export class ExampleActions {
  private readonly expensesService = inject(ExpensesService);

  public async createExpense(expense: CreateExpenseDto): Promise<ExpenseDto> {
    return firstValueFrom(this.expensesService.expenseControllerCreateExpense(expense));
  }
}
```

Once an endpoint is documented to return a message, keep the generated
observable typed and store the result in a signal for the template:

```ts
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ExpensesService } from 'src/client/api/generated/expenses/expenses.service';

@Injectable({ providedIn: 'root' })
export class ExampleActions {
  private readonly expensesService = inject(ExpensesService);
  public readonly $message = signal<string | undefined>(undefined);

  public async refreshExpenses(): Promise<void> {
    const response = await firstValueFrom(this.expensesService.expenseControllerGetExpenses());
    this.$message.set(`${response.length} expenses loaded`);
  }
}
```

Render the message in the Angular template:

```html
@if ($message(); as message) {
<p role="status">{{ message }}</p>
}
```

Use the generated method and generated request types for request bodies and
parameters. Keep application-specific state updates in the owning component
or state service, not in a second HTTP client layer.
