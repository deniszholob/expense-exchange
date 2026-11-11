import { HttpHeaders } from '@angular/common/http';

export type StrictHttpResponse<T> = HttpHeaders & {
  readonly body: T;
};
