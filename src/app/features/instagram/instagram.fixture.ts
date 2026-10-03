import type { InstagramPost } from './instagram.model';

/**
 * Development-only tiles, reachable solely from the /ui gallery.
 *
 * Reuses the About photo as a stand-in image: what the gallery needs to review
 * is the grid's layout, not the content. No like counts -- the design's are
 * invented.
 */
const STAND_IN = {
  webp: '/img/about-driver-480.webp',
  jpg: '/img/about-driver-480.jpg',
  width: 480,
  height: 640,
};

export const INSTAGRAM_FIXTURE: readonly InstagramPost[] = [
  {
    id: '1',
    permalink: 'https://www.instagram.com/hucarbus/',
    caption: 'Pie de foto de ejemplo',
    image: STAND_IN,
  },
  { id: '2', permalink: 'https://www.instagram.com/hucarbus/', caption: '', image: STAND_IN },
  {
    id: '3',
    permalink: 'https://www.instagram.com/hucarbus/',
    caption: 'Otro pie de foto',
    image: STAND_IN,
  },
];
