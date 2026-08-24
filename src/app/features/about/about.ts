import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
  imports: [Icon],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly config = inject(SITE_CONFIG);

  /**
   * All three are unverified client claims, which is why they come from config
   * rather than the template. The rating in particular is derived from review
   * content that cannot ship, so it must be confirmed or dropped before this
   * reaches production.
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
    {
      value: this.config.rating,
      label: $localize`:Stat label|@@about.stats.rating:valoración media`,
    },
  ]);
}
