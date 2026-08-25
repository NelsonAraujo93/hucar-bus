import type { PlaceholderTone } from '../../shared/ui/image-placeholder/image-placeholder';

export interface InstagramPost {
  readonly id: string;
  /** Until real photographs exist, each tile is a tone block. */
  readonly tone: PlaceholderTone;
  /**
   * Omitted deliberately while unconfirmed.
   *
   * The design's captions name specific places -- Famara, Papagayo, Timanfaya --
   * but they were written against placeholder blocks and nobody has verified
   * that the supplied photographs show those places. Captioning a photo of the
   * wrong beach is the kind of error a local visitor spots immediately.
   */
  readonly caption?: string;
  /** Link to the post, when the feed is real. */
  readonly href?: string;
}
