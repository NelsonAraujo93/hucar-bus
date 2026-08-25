import { Routes } from '@angular/router';
import { Home } from './features/home/home';

/** Production routes. The /ui gallery is deliberately not among them. */
export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
];
