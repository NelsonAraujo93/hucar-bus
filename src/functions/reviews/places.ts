import type { PublicReview, ReviewsSnapshot } from '../../shared/reviews/protocol.js';

/**
 * Reads a place's rating and reviews from the Places API (New).
 *
 * Live on every call, never stored: under Google's EEA terms only the place
 * ID may be cached. The field mask asks for exactly what the page shows,
 * which is also what decides the price of the request.
 */

export type PlacesResult =
  | { readonly ok: true; readonly snapshot: ReviewsSnapshot }
  | { readonly ok: false; readonly status: number };

export type PlacesReader = (placeId: string, languageCode: string) => Promise<PlacesResult>;

const FIELDS = ['rating', 'userRatingCount', 'googleMapsUri', 'reviews'].join(',');

/** Author photos are fetched only from Google's image host. */
const AVATAR_HOST = /^(?:[a-z0-9-]+\.)*googleusercontent\.com$/;

/** Larger than any avatar Google serves at this size; anything bigger is not one. */
const MAX_AVATAR_BYTES = 40_000;

const TIMEOUT_MS = 4_000;

interface LocalizedText {
  readonly text?: string;
  readonly languageCode?: string;
}

interface PlacesReview {
  readonly rating?: number;
  readonly relativePublishTimeDescription?: string;
  readonly text?: LocalizedText;
  readonly originalText?: LocalizedText;
  readonly authorAttribution?: {
    readonly displayName?: string;
    readonly uri?: string;
    readonly photoUri?: string;
  };
}

interface PlacesPlace {
  readonly rating?: number;
  readonly userRatingCount?: number;
  readonly googleMapsUri?: string;
  readonly reviews?: readonly PlacesReview[];
}

export function createPlacesReader(apiKey: string, fetchFn: typeof fetch = fetch): PlacesReader {
  async function avatar(uri: string | undefined): Promise<string | null> {
    if (!uri) {
      return null;
    }
    try {
      const url = new URL(uri);
      if (url.protocol !== 'https:' || !AVATAR_HOST.test(url.hostname)) {
        return null;
      }
      const response = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const type = response.headers.get('content-type') ?? '';
      if (!response.ok || !type.startsWith('image/')) {
        return null;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_AVATAR_BYTES) {
        return null;
      }
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return `data:${type.split(';')[0]};base64,${btoa(binary)}`;
    } catch {
      return null;
    }
  }

  async function toPublic(review: PlacesReview): Promise<PublicReview | null> {
    const text = review.text?.text?.trim();
    const rating = review.rating;
    const author = review.authorAttribution?.displayName?.trim();
    if (!text || !author || typeof rating !== 'number') {
      return null;
    }
    const original = review.originalText?.languageCode;
    return {
      author,
      authorUri: review.authorAttribution?.uri ?? null,
      avatar: await avatar(review.authorAttribution?.photoUri),
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      when: review.relativePublishTimeDescription ?? '',
      text,
      translated: original !== undefined && original !== review.text?.languageCode,
    };
  }

  return async (placeId, languageCode) => {
    let response: Response;
    try {
      const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
      url.searchParams.set('languageCode', languageCode);
      response = await fetchFn(url, {
        headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELDS },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return { ok: false, status: 0 };
    }
    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const place = (await response.json().catch(() => null)) as PlacesPlace | null;
    if (place === null) {
      return { ok: false, status: 502 };
    }

    // Every review Google returns, in Google's order -- never filtered to the
    // best ones. Showing only favourable reviews as if they were representative
    // is an unfair commercial practice under EU consumer law.
    const reviews = (await Promise.all((place.reviews ?? []).map(toPublic))).filter(
      (review): review is PublicReview => review !== null,
    );

    return {
      ok: true,
      snapshot: {
        rating: typeof place.rating === 'number' ? place.rating : null,
        count: place.userRatingCount ?? 0,
        mapsUri: place.googleMapsUri ?? null,
        reviews,
      },
    };
  };
}
