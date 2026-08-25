import type { InstagramPost } from './instagram.model';

/**
 * Development-only tiles, reachable solely from the /ui gallery.
 *
 * Carries no captions and no like counts. The design's counts (284, 412, 198…)
 * are invented and the README says to drop them; the captions are unverified.
 * What remains is nine tone blocks, which is exactly what the grid needs to be
 * reviewed for layout.
 */
export const INSTAGRAM_FIXTURE: readonly InstagramPost[] = [
  { id: '1', tone: 'sunset' },
  { id: '2', tone: 'ocean' },
  { id: '3', tone: 'night' },
  { id: '4', tone: 'sand' },
  { id: '5', tone: 'sunset' },
  { id: '6', tone: 'ocean' },
  { id: '7', tone: 'night' },
  { id: '8', tone: 'sand' },
  { id: '9', tone: 'sunset' },
];
