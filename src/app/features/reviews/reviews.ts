import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { BreakpointObserver } from '../../core/layout/breakpoint';
import { Icon } from '../../shared/ui/icon/icon';
import { SectionHeader } from '../../shared/ui/section-header/section-header';
import type { Review, ReviewSummary } from './reviews.model';

const VISIBLE_BY_BREAKPOINT = { desktop: 3, tablet: 2, mobile: 1 } as const;

/** Below this, a horizontal drag counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 40;

/**
 * Customer reviews carousel.
 *
 * Purely presentational: it takes reviews as an input and renders nothing when
 * given none. That is deliberate. The only review content that exists is
 * invented, and this repository deploys automatically, so the component must be
 * incapable of publishing anything on its own. The page does not compose it at
 * all yet; the development gallery feeds it a fixture.
 */
@Component({
  selector: 'hb-reviews',
  imports: [Icon, SectionHeader],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews {
  private readonly breakpoint = inject(BreakpointObserver);

  readonly reviews = input<readonly Review[]>([]);
  /** Omitted when there is no verified rating to show. */
  readonly summary = input<ReviewSummary | undefined>(undefined);

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
