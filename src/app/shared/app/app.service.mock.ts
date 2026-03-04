import { Provider } from '@angular/core';

// import { Observable, of } from 'rxjs';
import { AppService } from './app.service';
// import { ExampleReturnType } from './example-return-type.model';
// import { MOCK_ExampleReturnType } from './example-return-type.model.mock';
// export const MOCK_ExampleReturnType: ExampleReturnType = {};

export const MOCK_AppService: Partial<AppService> = {
  // method(): Observable<ExampleReturnType> {
  //  return of(MOCK_ExampleReturnType);
  // },
};

export const MOCK_AppServiceProvider: Provider = {
  provide: AppService,
  useValue: MOCK_AppService,
};
