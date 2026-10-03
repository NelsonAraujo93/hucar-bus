import { InjectionToken } from '@angular/core';

/**
 * `fetch`, injectable so tests can answer for the network.
 *
 * Plain fetch rather than HttpClient: the site makes two requests in all, and
 * HttpClient would add its weight to every visitor's initial bundle to serve
 * them.
 */
export const FETCH = new InjectionToken<typeof fetch>('hb.fetch', {
  providedIn: 'root',
  factory: () => globalThis.fetch.bind(globalThis),
});
