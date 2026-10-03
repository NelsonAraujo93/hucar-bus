/**
 * The Instagram feed file written at build time by scripts/fetch-instagram.mjs
 * and read by the page. Everything in it is served from this site: the images
 * are copied, never hotlinked, so a visitor's browser never contacts Meta.
 */

export const INSTAGRAM_FEED_PATH = '/instagram/feed.json';

export interface FeedImage {
  readonly webp: string;
  readonly jpg: string;
  readonly width: number;
  readonly height: number;
}

export interface FeedPost {
  readonly id: string;
  /** The post on Instagram. */
  readonly permalink: string;
  /** The owner's own caption, shortened to its first line. Empty when none. */
  readonly caption: string;
  readonly image: FeedImage;
}

export interface InstagramFeed {
  /** ISO time the feed was fetched. */
  readonly fetchedAt: string;
  readonly posts: readonly FeedPost[];
}
