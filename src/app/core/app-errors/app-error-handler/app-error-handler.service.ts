import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { distinctUntilChanged, filter, Subject } from 'rxjs';
import { typedNullCheck } from 'src/app/utils';

import { AppError } from '../app-error.model';
import { AppErrorData } from '../app-error-data.model';

interface UnhandledError {
  appError: AppErrorData | null | undefined;
  error: unknown | Error;
}

@Injectable({ providedIn: 'root' })
export class AppErrorHandlerService extends ErrorHandler {
  private appErrors$: Subject<UnhandledError> = new Subject<UnhandledError>();

  constructor(private ngZone: NgZone) {
    super();
    this.handleErrors();
  }

  public override handleError(error: unknown): void {
    this.appErrors$.next({ appError: parseError(error), error });
  }

  private handleErrors(): void {
    this.appErrors$
      .pipe(
        distinctUntilChanged(errorComparator),
        filter((v: UnhandledError): boolean => typedNullCheck(v.appError)),
      )
      .subscribe((err: UnhandledError): void => {
        this.handleAppError(err);
        super.handleError(err.error);
      });
  }

  /**
   * Change detection will not run on async errors
   * Needs ngZone.run() to have things executed withing angular zone, with change detection etc..
   * @see https://youtu.be/e03EHZIVJtM?si=xJ9G9Qt7_0bWkrls&t=1037
   * @see https://github.com/angular/angular/issues/19984
   */
  private handleAppError({ appError, error }: UnhandledError): void {
    this.ngZone.run(() => {
      // TODO: handle app error
    });
  }
}

function parseError(error: unknown): AppErrorData | null {
  const appErrorData: AppErrorData | null = null;

  switch (true) {
    case typeof error === 'string': {
      return {
        title: 'Error',
        description: error,
        recommendedAction:
          'Please report to https://github.com/deniszholob/template-nx-project/issues',
      };
    }
    case error instanceof Error: {
      return {
        title: error.name,
        description: error.message,
        recommendedAction:
          'Please report to https://github.com/deniszholob/template-nx-project/issues',
      };
    }
    case error instanceof HttpErrorResponse: {
      return {
        title: 'Http Error',
        description: `Http status code: ${error.status} - ${error.statusText}`,
        recommendedAction:
          'Please check your internet connection and try again later',
      };
    }
    case error instanceof AppError: {
      return error.error;
    }
    default: {
      return appErrorData;
    }
  }
}

function errorComparator(a: UnhandledError, b: UnhandledError): boolean {
  return appErrorComparator(a.appError, b.appError);
}

function appErrorComparator(
  a: AppErrorData | null | undefined,
  b: AppErrorData | null | undefined,
): boolean {
  if (a == null || b == null) return a === b;
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.recommendedAction === b.recommendedAction
  );
}
