import { ErrorHandler, NgModule } from '@angular/core';

import { AppErrorHandlerService } from './app-error-handler.service';

@NgModule({
  providers: [
    {
      // Overrides angular's default error handler
      provide: ErrorHandler,
      useClass: AppErrorHandlerService,
    },
  ],
})
export class AppErrorHandlerModule {}
