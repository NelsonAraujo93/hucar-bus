import { Component, inject, signal } from '@angular/core';
import { INSTAGRAM_GATEWAY } from '../../application/instagram/instagram-gateway';
import type { FeedPost } from '../../../shared/instagram/feed';
import { Instagram } from './instagram';

/**
 * Loads the build-time Instagram feed and hands it to the grid.
 *
 * Rendered inside `@defer (on viewport)` on the home page, so the feed and its
 * images load only for visitors who scroll this far. Renders nothing until
 * posts arrive, and nothing at all if there are none.
 */
@Component({
  selector: 'hb-instagram-section',
  imports: [Instagram],
  template: `<hb-instagram [posts]="posts()" />`,
})
export class InstagramSection {
  private readonly gateway = inject(INSTAGRAM_GATEWAY);

  protected readonly posts = signal<readonly FeedPost[]>([]);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.posts.set(await this.gateway.load());
  }
}
