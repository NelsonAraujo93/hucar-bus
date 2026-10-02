import { DecimalPipe, formatNumber } from '@angular/common';
import { Component, computed, inject, input, LOCALE_ID, signal } from '@angular/core';
import { BreakpointObserver } from '../../core/layout/breakpoint';
import { Icon } from '../../shared/ui/icon/icon';
import { SectionHeader } from '../../shared/ui/section-header/section-header';
import { ReviewCard } from './review-card/review-card';
import type { Review, ReviewSummary } from './reviews.model';

const VISIBLE_BY_BREAKPOINT = { desktop: 3, tablet: 2, mobile: 1 } as const;

/** Below this, a horizontal drag counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 40;

/**
 * Google reviews carousel.
 *
 * Purely presentational: it takes reviews as an input and renders nothing when
 * given none, so it can never publish anything on its own. ReviewsSection
 * feeds it the live Google snapshot; the development gallery feeds it a
 * fixture.
 */
@Component({
  selector: 'hb-reviews',
  imports: [DecimalPipe, Icon, ReviewCard, SectionHeader],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class Reviews {
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly locale = inject(LOCALE_ID);

  readonly reviews = input<readonly Review[]>([]);
  /** Omitted when there is no verified rating to show. */
  readonly summary = input<ReviewSummary | undefined>(undefined);

  /**
   * Google's required attribution, the same words in every language: it names
   * the source, so it is never translated.
   */
  protected readonly attribution = 'Google Maps';

  protected readonly stars = [1, 2, 3, 4, 5] as const;

  /** Whole stars for the average: 4.7 shows five, 4.2 shows four. */
  protected readonly roundedAverage = computed(() => Math.round(this.summary()?.rating ?? 0));

  protected readonly averageLabel = computed(
    () =>
      // Formatted like the visible number, so a screen reader hears "4,4" on
      // the Spanish site where the page shows 4,4.
      $localize`:Average Google rating|@@reviews.average.label:Valoración media: ${formatNumber(this.summary()?.rating ?? 0, this.locale, '1.1-1')}:rating: de 5`,
  );

  protected readonly index = signal(0);

  protected readonly visible = computed(() => VISIBLE_BY_BREAKPOINT[this.breakpoint.current()]);

  /** Last index that still fills the row; never negative. */
  protected readonly maxIndex = computed(() => Math.max(0, this.reviews().length - this.visible()));

  protected readonly atStart = computed(() => this.index() <= 0);
  protected readonly atEnd = computed(() => this.index() >= this.maxIndex());

  /** Read by CSS, which owns the card widths and the arithmetic. */
  protected readonly offset = computed(() => String(this.clamped()));

  private clamped(): number {
    return Math.min(this.index(), this.maxIndex());
  }

  protected previous(): void {
    this.index.set(Math.max(0, this.clamped() - 1));
  }

  protected next(): void {
    this.index.set(Math.min(this.maxIndex(), this.clamped() + 1));
  }

  protected goTo(target: number): void {
    this.index.set(Math.min(this.maxIndex(), Math.max(0, target)));
  }

  /** Arrow keys, which the design does not provide at all. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }

  private touchStartX: number | undefined;

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const start = this.touchStartX;
    this.touchStartX = undefined;
    if (start === undefined) {
      return;
    }

    const delta = (event.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return;
    }

    if (delta < 0) {
      this.next();
    } else {
      this.previous();
    }
  }
}
