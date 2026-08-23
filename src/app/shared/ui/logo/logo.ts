import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LogoVariant = 'nav' | 'footer';

/** Intrinsic size of the supplied asset, used to derive width and avoid CLS. */
const INTRINSIC_RATIO = 1383 / 1137;

const HEIGHTS: Record<LogoVariant, number> = {
  nav: 56,
  footer: 88,
};

/**
 * Brand mark, linking home.
 *
 * The footer variant sits on a white card. That exists only because the
 * supplied asset is an opaque JPEG that cannot sit on the dark footer -- once a
 * vector or transparent PNG arrives, the card should go.
 */
@Component({
  selector: 'hb-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
  },
})
export class Logo {
  readonly variant = input<LogoVariant>('nav');

  protected readonly height = computed(() => HEIGHTS[this.variant()]);
  protected readonly width = computed(() => Math.round(this.height() * INTRINSIC_RATIO));
}
