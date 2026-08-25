import { Routes } from '@angular/router';
import { Home } from './features/home/home';

/**
 * Development routes.
 *
 * The production build swaps this file for app.routes.prod.ts via
 * fileReplacements, so /ui and its chunk are absent from the deployed bundle
 * rather than merely unreachable. This repository is public and main deploys
 * automatically, so "unreachable" would not be good enough.
 */
export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'ui',
    loadComponent: () => import('./features/ui-gallery/ui-gallery').then((m) => m.UiGallery),
  },
];
