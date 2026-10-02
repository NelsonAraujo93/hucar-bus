import { inject, Service } from '@angular/core';
import type { ReviewsGateway } from '../../application/reviews/reviews-gateway';
import type { SupportedLocale } from '../../../shared/i18n/negotiate-locale';
import {
  REVIEWS_ENDPOINT,
  type ReviewsResponseBody,
  type ReviewsSnapshot,
} from '../../../shared/reviews/protocol';
import { FETCH } from '../http/fetch';

/** Reads the live Google snapshot from `/api/reviews`. */
@Service()
export class HttpReviewsGateway implements ReviewsGateway {
  private readonly fetch = inject(FETCH);

  async load(locale: SupportedLocale): Promise<ReviewsSnapshot | null> {
    try {
      // Trailing slash to match vercel.json's trailingSlash, so the request is
      // not answered with a redirect first.
      const response = await this.fetch(`${REVIEWS_ENDPOINT}/?locale=${locale}`);
      const body = (await response.json()) as ReviewsResponseBody;
      if (!response.ok || !body.ok) {
        return null;
      }
      return {
        rating: body.rating,
        count: body.count,
        mapsUri: body.mapsUri,
        reviews: body.reviews,
      };
    } catch {
      return null;
    }
  }
}
