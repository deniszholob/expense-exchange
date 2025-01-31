import { Component } from '@angular/core';
import { of } from 'rxjs';

@Component({ template: `` })
class TestComponent {}

// Mock Routes
const mockRoutes = [
  { path: 'dashboard', component: TestComponent, canActivate: [() => true] },
  { path: 'settings', component: TestComponent }, // No guard, always visible
  { path: 'expenses', component: TestComponent, canActivate: [() => false] }, // Will be filtered out
];

// Mock Router
export const MOCK_Router = {
  config: mockRoutes,
  events: of(), // Empty observable to prevent "router.events is undefined"
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  navigate: () => {},
  createUrlTree: () => null,
};
