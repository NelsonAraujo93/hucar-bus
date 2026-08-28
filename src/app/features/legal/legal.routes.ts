import { Routes } from '@angular/router';

/**
 * The three legal documents, shared by the development and production route
 * tables so neither can drift from the other.
 *
 * Paths stay Spanish in both locales, like the section anchors: the English
 * build serves them at /en/privacidad. Translating the path would break every
 * link shared between locales and every link already given to a client, for no
 * SEO gain -- the page content is what gets indexed, and hreflang already tells
 * crawlers the two are the same document.
 *
 * Lazily loaded. These are secondary pages that most visitors never open, and
 * the legal text is a meaningful chunk of markup to put in the initial bundle
 * of a landing page.
 *
 * Every one of them must be prerendered. app.routes.server.ts renders '**',
 * which covers them, but a route added without a prerendered document would 404
 * on direct navigation -- and a privacy policy that 404s is worse than none.
 */
export const legalRoutes: Routes = [
  {
    path: 'privacidad',
    loadComponent: () => import('./privacy').then((m) => m.Privacy),
  },
  {
    path: 'terminos',
    loadComponent: () => import('./terms').then((m) => m.Terms),
  },
  {
    path: 'aviso-legal',
    loadComponent: () => import('./legal-notice').then((m) => m.LegalNotice),
  },
];
