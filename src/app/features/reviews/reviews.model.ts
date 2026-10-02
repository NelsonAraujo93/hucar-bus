import type { PublicReview } from '../../../shared/reviews/protocol';

/** One review, exactly as Google returned it: author, rating, text. */
export type Review = PublicReview;

/** The place's overall standing, shown above the reviews. */
export interface ReviewSummary {
  /** Google's average, e.g. 4.7. Null when Google has none yet. */
  readonly rating: number | null;
  readonly count: number;
  /** Every review on Google Maps; required context when only a few are shown. */
  readonly mapsUri: string | null;
}
