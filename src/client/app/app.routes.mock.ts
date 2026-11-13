// #region Imports
import { Component } from '@angular/core';
import { of } from 'rxjs';
import { PageRoute } from './app.info';
// #endregion

// #region Implementation

@Component({ template: ``, host: { class: 'contents' } })
class TestComponent {}

// Mock Routes
const mockRoutes = [
  {
    path: PageRoute.Dashboard,
    component: TestComponent,
    canActivate: [() => true],
  },
  { path: PageRoute.Settings, component: TestComponent },
  {
    path: PageRoute.Transactions,
    component: TestComponent,
    canActivate: [() => false],
  }, // Will be filtered out
];

// Mock Router
export const MOCK_Router = {
  config: mockRoutes,
  events: of(), // Empty observable to prevent "router.events is undefined"

  navigate: () => {},
  createUrlTree: () => null,
};

// #endregion
