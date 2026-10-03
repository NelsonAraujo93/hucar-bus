import { InjectionToken } from '@angular/core';
import type { FeedPost } from '../../../shared/instagram/feed';

/**
 * Where the Instagram section gets its posts. An empty list for any failure:
 * the section's answer to every problem is to stay hidden.
 */
export interface InstagramGateway {
  load(): Promise<readonly FeedPost[]>;
}

/** Bound to the HTTP adapter in the application config, the composition root. */
export const INSTAGRAM_GATEWAY = new InjectionToken<InstagramGateway>('hb.instagramGateway');
