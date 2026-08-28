import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Icon } from '../../shared/ui/icon/icon';
import { ImagePlaceholder } from '../../shared/ui/image-placeholder/image-placeholder';

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
  imports: [Icon, ImagePlaceholder],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly config = inject(SITE_CONFIG);

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
