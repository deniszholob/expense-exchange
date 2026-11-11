import { NgZone } from '@angular/core';

import { AppErrorHandlerService } from './app-error-handler.service';

describe('AppErrorHandlerService', () => {
  const MOCK_ngZone: NgZone = new NgZone({});
  const service: AppErrorHandlerService = new AppErrorHandlerService(
    MOCK_ngZone,
  );

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
