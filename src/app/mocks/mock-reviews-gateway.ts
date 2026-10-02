import type { ReviewsGateway } from '../application/reviews/reviews-gateway';
import { REVIEW_FIXTURE, REVIEW_SUMMARY_FIXTURE } from '../features/reviews/reviews.fixture';

/**
 * INVENTED REVIEWS, for development and Vercel previews only.
 *
 * Imported dynamically from app.config.ts behind `HB_MOCKS`, which is false in
 * production builds -- where the import, this module and the fixture are all
 * removed. scripts/assert-localized-build.mjs fails the build if a fixture
 * name ever appears in the output.
 *
 * TEMPORARY: removed before release to main.
 */
export const mockReviewsGateway: ReviewsGateway = {
  load: async () => ({ ...REVIEW_SUMMARY_FIXTURE, reviews: REVIEW_FIXTURE }),
};
