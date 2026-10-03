import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '../../shared/i18n/negotiate-locale.js';
import type { ReviewsResponseBody } from '../../shared/reviews/protocol.js';
import type { DailyBudget } from '../shared/daily-budget.js';
import type { RateLimiter } from '../shared/rate-limit.js';
import type { PlacesReader } from './places.js';

/**
 * `/api/reviews`, as a plain function of a Request.
 *
 * Every answer is `no-store`: Google's terms forbid caching review content,
 * and a CDN or browser cache is a cache.
 */

export interface ReviewsDeps {
  /** Null when the key or the place ID is not configured: the section then stays hidden. */
  readonly read: PlacesReader | null;
  readonly placeId: string | null;
  readonly limiter: RateLimiter;
  /** Caps paid Google calls per day, since the provider quota could not be set. */
  readonly budget: DailyBudget;
  readonly now: () => number;
  readonly log: (event: string, detail?: Record<string, string | number | boolean>) => void;
}

function reply(status: number, body: ReviewsResponseBody, headers: HeadersInit = {}): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export async function handleReviews(request: Request, deps: ReviewsDeps): Promise<Response> {
  if (request.method !== 'GET') {
    return reply(405, { ok: false, error: 'bad_request' }, { allow: 'GET' });
  }

  if (deps.read === null || deps.placeId === null) {
    return reply(503, { ok: false, error: 'unavailable' });
  }

  if (!deps.limiter.hit(clientKey(request), deps.now())) {
    deps.log('reviews.rate_limited');
    return reply(429, { ok: false, error: 'rate_limited' });
  }

  if (!deps.budget.spend(deps.now())) {
    deps.log('reviews.budget_exhausted');
    return reply(503, { ok: false, error: 'unavailable' });
  }

  const requested = new URL(request.url).searchParams.get('locale');
  const locale = SUPPORTED_LOCALES.find((supported) => supported === requested) ?? FALLBACK_LOCALE;

  const result = await deps.read(deps.placeId, locale);
  if (!result.ok) {
    deps.log('reviews.places_failed', { status: result.status });
    return reply(502, { ok: false, error: 'unavailable' });
  }

  deps.log('reviews.served', { count: result.snapshot.reviews.length, locale });
  return reply(200, { ok: true, ...result.snapshot });
}
