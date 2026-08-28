import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { legalRoutes } from './features/legal/legal.routes';

/** Production routes. The /ui gallery is deliberately not among them. */
export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  ...legalRoutes,
];
