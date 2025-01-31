import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiConfiguration {
  public rootUrl: string = 'http://localhost:3000';
}

export interface ApiConfigurationParams {
  rootUrl?: string;
}
