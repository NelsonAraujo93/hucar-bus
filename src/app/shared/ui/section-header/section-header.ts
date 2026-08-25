import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Which token paints the eyebrow. About uses lava-red; everything else orange. */
export type EyebrowTone = 'sunset-orange' | 'lava-red';

/**
 * Centred section heading: optional eyebrow, required title, optional subtitle.
 *
 * Presentational only -- it takes strings and renders them. Callers own the
 * copy, which matters because every user-visible string has to be $localize
 * tagged at its source rather than here.
 */
@Component({
  selector: 'hb-section-header',
  templateUrl: './section-header.html',
  styleUrl: './section-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeader {
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();

  /** Inverts title and subtitle for placement on a dark section. */
  readonly dark = input(false);

  /**
   * Exposed rather than special-cased for About, per the design notes. Typed to
   * the two tokens the design actually uses, so a caller cannot pass a colour
   * that is not in the palette.
   */
  readonly eyebrowTone = input<EyebrowTone>('sunset-orange');
}
