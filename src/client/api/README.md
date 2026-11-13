# Generated API clients

This README documents the generated OpenAPI client artifacts in
`src/client/api/generated/`. Orval clears and regenerates that directory.
Do not manually edit, add, or remove generated files there.
Changes will be overwritten the next time the API client is generated.

The source of truth is the shared domain schemas in `src/util/` and the NestJS
controllers in `src/server/`. The generation flow is:

```text
NestJS controllers and DTOs -> OpenAPI document -> Orval -> Angular HttpClient services and httpResource functions
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

import { transactionControllerGetTransactionsResource } from 'src/client/api/generated/transactions/transactions.resource';

@Injectable({ providedIn: 'root' })
export class ExampleState {
  public readonly transactionsResource = transactionControllerGetTransactionsResource({
    defaultValue: [],
  });

  public reload(): void {
    this.transactionsResource.reload();
  }
}
```

Read the resource through its signals in the Angular template. Use
`hasValue()` before reading the resolved value:

```html
@if (transactionsResource.isLoading()) {
<p>Loading transactions...</p>
} @else if (transactionsResource.error(); as error) {
<p>Unable to load transactions: {{ error.message }}</p>
} @else if (transactionsResource.hasValue()) {
<p>Transactions: {{ transactionsResource.value().length }}</p>
}
```

### Mutations with generated `HttpClient` services

Generated services return RxJS observables. Convert them to promises when an
imperative event handler needs to await the request:

```ts
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { CreateTransactionDto, TransactionDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import { TransactionsService } from 'src/client/api/generated/transactions/transactions.service';

@Injectable({ providedIn: 'root' })
export class ExampleActions {
  private readonly transactionsService = inject(TransactionsService);

  public async createTransaction(transaction: CreateTransactionDto): Promise<TransactionDto> {
    return firstValueFrom(this.transactionsService.transactionControllerCreateTransaction(transaction));
  }
}
```

Once an endpoint is documented to return a message, keep the generated
observable typed and store the result in a signal for the template:

```ts
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TransactionsService } from 'src/client/api/generated/transactions/transactions.service';

@Injectable({ providedIn: 'root' })
export class ExampleActions {
  private readonly transactionsService = inject(TransactionsService);
  public readonly $message = signal<string | undefined>(undefined);

  public async refreshTransactions(): Promise<void> {
    const response = await firstValueFrom(this.transactionsService.transactionControllerGetTransactions());
    this.$message.set(`${response.length} transactions loaded`);
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
