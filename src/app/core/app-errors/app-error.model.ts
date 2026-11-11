import { AppErrorData } from './app-error-data.model';

const DEFAULT_APP_ERROR_DATA: AppErrorData = {
  title: 'App Error',
  description: 'A wild error has appeared.',
  recommendedAction: `Have you tired turning it off and on again?
  If so, please report to https://github.com/deniszholob/template-nx-project/issues`,
};

/**
 * @usage 
  throw new AppError({
    title: `title`,
    description: `description`,
    recommendedAction: `recommendedAction`,
  });

  With RxJs:
   return  throwError(new AppError({
    title: `title`,
    description: `description`,
    recommendedAction: `recommendedAction`,
  }));
 */
export class AppError implements Error {
  public readonly name = 'AppError';
  public readonly message: string;
  public readonly error: AppErrorData;

  constructor(error: Partial<AppErrorData>) {
    this.error = {
      title: error.title ?? DEFAULT_APP_ERROR_DATA.title,
      description: error.description ?? DEFAULT_APP_ERROR_DATA.description,
      recommendedAction:
        error.recommendedAction ?? DEFAULT_APP_ERROR_DATA.recommendedAction,
      details: error.details,
    };
    this.message = this.error.description;
  }
}
