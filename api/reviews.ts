import { handleReviews } from '../src/functions/reviews/handler.js';
import { createPlacesReader } from '../src/functions/reviews/places.js';
import { createDailyBudget } from '../src/functions/shared/daily-budget.js';
import { createRateLimiter } from '../src/functions/shared/rate-limit.js';

/**
 * Vercel entry point for the Google reviews section. Wiring only: the logic
 * and its tests live in src/functions/reviews/.
 */

/** A visitor scrolling past the section a few times is fine; a script is not. */
const limiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

/**
 * 30 a day per instance keeps a month inside Google's free allowance for
 * review data (1,000 requests) on a site this size. When it runs out, the
 * section hides until midnight UTC.
 */
const budget = createDailyBudget(30);

export function GET(request: Request): Promise<Response> {
  const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
  const placeId = process.env['GOOGLE_PLACE_ID'] ?? null;

  return handleReviews(request, {
    read: apiKey ? createPlacesReader(apiKey) : null,
    placeId,
    limiter,
    budget,
    now: () => Date.now(),
    log: (event, detail) => console.info(JSON.stringify({ event, ...detail })),
  });
}
