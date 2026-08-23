import { InjectionToken } from '@angular/core';

/**
 * Absolute origin used to build canonical and alternate URLs.
 *
 * Canonical tags must be absolute, so the origin has to be known at build time.
 * Injected rather than inlined so tests do not depend on the production domain.
 */
export const SITE_ORIGIN = new InjectionToken<string>('hb.siteOrigin', {
  providedIn: 'root',
  factory: () => 'https://hucarbus.com',
});
