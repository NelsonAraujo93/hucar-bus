import { inject, Service } from '@angular/core';
import type { InstagramGateway } from '../../application/instagram/instagram-gateway';
import {
  INSTAGRAM_FEED_PATH,
  type FeedPost,
  type InstagramFeed,
} from '../../../shared/instagram/feed';
import { FETCH } from '../http/fetch';

/**
 * Reads the feed file the build wrote. Same origin, static, and refreshed only
 * when the site is rebuilt -- nothing here talks to Meta.
 */
@Service()
export class HttpInstagramGateway implements InstagramGateway {
  private readonly fetch = inject(FETCH);

  async load(): Promise<readonly FeedPost[]> {
    try {
      const response = await this.fetch(INSTAGRAM_FEED_PATH);
      if (!response.ok) {
        return [];
      }
      const feed = (await response.json()) as Partial<InstagramFeed>;
      return Array.isArray(feed.posts) ? feed.posts : [];
    } catch {
      return [];
    }
  }
}
