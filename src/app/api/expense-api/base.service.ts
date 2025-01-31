import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ApiConfiguration } from './api-configuration';

@Injectable({ providedIn: 'root' })
export class BaseService {
  constructor(
    protected apiConfiguration: ApiConfiguration,
    protected httpClient: HttpClient,
  ) {}

  private _rootUrl: string = '';

  public get rootUrl(): string {
    return this._rootUrl || this.apiConfiguration.rootUrl;
  }

  public set rootUrl(rootUrl: string) {
    this._rootUrl = rootUrl;
  }
}
