import { Component } from '@angular/core';

/**
 * MOCK: an OpenStreetMap view of the Arrecife base, for development and
 * Vercel previews only.
 *
 * Imported dynamically behind `HB_MOCKS`, so production bundles do not contain
 * it at all -- scripts/assert-localized-build.mjs checks the output. The
 * production map is still to be decided: an embedded third-party map would
 * need a consent decision first.
 *
 * TEMPORARY: removed before release to main.
 */
@Component({
  selector: 'hb-mock-map',
  template: `
    <iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=-13.5620%2C28.9560%2C-13.5380%2C28.9700&amp;layer=mapnik&amp;marker=28.9630%2C-13.5500"
      loading="lazy"
      referrerpolicy="no-referrer"
      i18n-title="Title of the map frame|@@contact.map.title"
      title="Mapa de la base de Hucar Bus en Arrecife"
    ></iframe>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 20px;
    }

    iframe {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      border: 0;
      border-radius: var(--radius-16);
    }
  `,
})
export class MockMap {}
