import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ImagePlaceholder } from '../../shared/ui/image-placeholder/image-placeholder';
import { SectionHeader } from '../../shared/ui/section-header/section-header';
import type { InstagramPost } from './instagram.model';

/**
 * Instagram grid.
 *
 * Like Reviews, presentational and silent when empty: the section's scope is
 * still undecided -- real feed, curated stills, or dropped entirely -- so it
 * must not put anything on the page by itself. The gallery feeds it a fixture.
 */
@Component({
  selector: 'hb-instagram',
  imports: [Button, Icon, ImagePlaceholder, SectionHeader],
  templateUrl: './instagram.html',
  styleUrl: './instagram.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Instagram {
  protected readonly config = inject(SITE_CONFIG);

  readonly posts = input<readonly InstagramPost[]>([]);

  /**
   * Derived from the profile URL so the handle is stated once. Bound rather
   * than written in the template because it is an account name, not copy -- the
   * eyebrow elsewhere is translatable and should stay so.
   */
  protected readonly handle = computed(
    () => `@${this.config.instagramUrl.replace(/\/+$/, '').split('/').pop() ?? ''}`,
  );
}
