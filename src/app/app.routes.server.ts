import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Prerenders every route the router config declares. In production that is
    // only the home route, because fileReplacements swaps app.routes.ts for a
    // version without the /ui gallery -- so no /ui document is ever emitted.
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
