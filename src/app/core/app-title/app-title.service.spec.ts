import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';

import { AppTitleService } from './app-title.service';

describe('AppTitleService', () => {
  const DEFAULT_TITLE = 'DEFAULT';
  const title: Title = new Title({});
  const service: AppTitleService = new AppTitleService(title);

  beforeEach(() => {
    title.setTitle(DEFAULT_TITLE);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should updateTitle with empty url', () => {
    const snapshot: RouterStateSnapshot = {
      url: '',
      root: { queryParams: {} },
    } as unknown as RouterStateSnapshot;
    service.updateTitle(snapshot);
    expect(title.getTitle()).toStrictEqual(DEFAULT_TITLE);
  });

  it('should updateTitle with deep url', () => {
    const snapshot: RouterStateSnapshot = {
      url: 'page',
      root: { queryParams: {} },
    } as unknown as RouterStateSnapshot;
    service.updateTitle(snapshot);
    expect(title.getTitle()).toStrictEqual('Expense Exchange - Page');
  });

  it('should updateTitle with deep url', () => {
    const snapshot: RouterStateSnapshot = {
      url: 'article/space',
      root: { queryParams: {} },
    } as unknown as RouterStateSnapshot;
    service.updateTitle(snapshot);
    expect(title.getTitle()).toStrictEqual('Expense Exchange - Space');
  });

  it('should updateTitle with url and query params', () => {
    const snapshot: RouterStateSnapshot = {
      url: 'search',
      root: { queryParams: { q: 'bob' } },
    } as unknown as RouterStateSnapshot;
    service.updateTitle(snapshot);
    expect(title.getTitle()).toStrictEqual('Expense Exchange - Search: "bob"');
  });
});
