import { InjectionToken } from '@angular/core';
import type { SupportedLocale } from '../../../shared/i18n/negotiate-locale';
import type { ReviewsSnapshot } from '../../../shared/reviews/protocol';

/**
 * Where the reviews section gets its data.
 *
 * Null means "nothing to show" for any reason -- not configured, budget spent,
 * Google unavailable. The section's answer to all of them is the same: stay
 * hidden. A reviews block that announces its own failure helps nobody.
 */
export interface ReviewsGateway {
  load(locale: SupportedLocale): Promise<ReviewsSnapshot | null>;
}

/** Bound to the HTTP adapter in the application config, the composition root. */
export const REVIEWS_GATEWAY = new InjectionToken<ReviewsGateway>('hb.reviewsGateway');
