import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { SectionHeader } from '../../shared/ui/section-header/section-header';
import type { InstagramPost } from './instagram.model';

/**
 * Instagram grid: the latest posts, each linking to Instagram.
 *
 * Presentational and silent when empty, so it can never put anything on the
 * page by itself. InstagramSection feeds it the build-time feed; the gallery
 * feeds it a fixture.
 */
@Component({
  selector: 'hb-instagram',
  imports: [Button, Icon, NgOptimizedImage, SectionHeader],
  templateUrl: './instagram.html',
  styleUrl: './instagram.css',
})
export class Instagram {
  protected readonly config = inject(SITE_CONFIG);

  /** For a post without a caption; the link then still has a name. */
  protected readonly genericAlt = $localize`:Alt text for an Instagram post without caption|@@instagram.post.alt:Publicación de Hucar Bus en Instagram`;

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
