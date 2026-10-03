/**
 * The wire contract between the reviews section and `/api/reviews`.
 *
 * Everything here is fetched live from Google on each request and never
 * stored: Google's terms allow caching only the place ID. Type-only, so the
 * function can load it as a native ES module.
 */

export const REVIEWS_ENDPOINT = '/api/reviews';

export interface PublicReview {
  readonly author: string;
  /** The author's Google Maps profile, which Google requires us to link. */
  readonly authorUri: string | null;
  /**
   * The author's photo as a data URI, fetched server-side so a visitor's
   * browser never contacts Google. Null when unavailable or too large.
   */
  readonly avatar: string | null;
  /** 1 to 5. */
  readonly rating: number;
  /** Localised by Google, e.g. "hace 2 semanas" or "2 weeks ago". */
  readonly when: string;
  readonly text: string;
  /** True when Google translated the text into the visitor's language. */
  readonly translated: boolean;
}

export interface ReviewsSnapshot {
  readonly rating: number | null;
  readonly count: number;
  /** The place on Google Maps, for "see all reviews". */
  readonly mapsUri: string | null;
  readonly reviews: readonly PublicReview[];
}

export type ReviewsResponseBody =
  | ({ readonly ok: true } & ReviewsSnapshot)
  | { readonly ok: false; readonly error: 'rate_limited' | 'unavailable' | 'bad_request' };
