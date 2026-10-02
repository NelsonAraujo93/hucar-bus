import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { REVIEWS_GATEWAY } from '../../application/reviews/reviews-gateway';
import { FALLBACK_LOCALE, toSupportedLocale } from '../../../shared/i18n/negotiate-locale';
import type { ReviewsSnapshot } from '../../../shared/reviews/protocol';
import { Reviews } from './reviews';

/**
 * Loads the live Google reviews and hands them to the carousel.
 *
 * Rendered inside `@defer (on viewport)` on the home page, so the request --
 * which Google bills -- is made only for visitors who scroll this far, and
 * never during prerendering. Until data arrives, and whenever none does, it
 * renders nothing: the carousel hides itself without reviews.
 */
@Component({
  selector: 'hb-reviews-section',
  imports: [Reviews],
  template: `
    @if (snapshot(); as data) {
      <hb-reviews
        [reviews]="data.reviews"
        [summary]="{ rating: data.rating, count: data.count, mapsUri: data.mapsUri }"
      />
    }
  `,
})
export class ReviewsSection {
  private readonly gateway = inject(REVIEWS_GATEWAY);
  private readonly locale = toSupportedLocale(inject(LOCALE_ID)) ?? FALLBACK_LOCALE;

  protected readonly snapshot = signal<ReviewsSnapshot | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.snapshot.set(await this.gateway.load(this.locale));
  }
}
