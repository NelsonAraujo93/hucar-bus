import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Icon } from '../../shared/ui/icon/icon';

interface Stat {
  readonly value: string;
  readonly label: string;
}

/**
 * Trust and provenance.
 *
 * Does not use SectionHeader: that primitive is centred, and this section's
 * heading is left-aligned inside a two-column layout. The Phase 3 plan suggests
 * reusing it for the lava-red eyebrow, but the alignment does not fit.
 */
@Component({
  selector: 'hb-about',
  imports: [Icon, NgOptimizedImage],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  protected readonly config = inject(SITE_CONFIG);

  /** Rendered width: full width once the columns stack, half the container above. */
  protected readonly photoSizes = '(width < 1024px) calc(100vw - 48px), 540px';

  /**
   * Both are unverified client claims, which is why they come from config rather
   * than the template.
   *
   * There was a third: a 4.8-star average rating. It was the same fabricated
   * figure the Reviews section is withheld for, reaching production through a
   * different door, and it is gone rather than confirmed -- the client has not
   * supplied a real rating, and the Google Places integration that would produce
   * one is still blocked. It returns when Reviews does, from the same source.
   */
  protected readonly stats = computed<readonly Stat[]>(() => [
    {
      value: this.config.yearsOfExperience,
      label: $localize`:Stat label|@@about.stats.years:años de experiencia`,
    },
    {
      value: this.config.availability,
      label: $localize`:Stat label|@@about.stats.availability:disponibilidad`,
    },
  ]);
}
