import type { ReviewsSnapshot } from '../../shared/reviews/protocol';
import { createDailyBudget } from '../shared/daily-budget';
import { createRateLimiter } from '../shared/rate-limit';
import { handleReviews, type ReviewsDeps } from './handler';
import type { PlacesResult } from './places';

const SNAPSHOT: ReviewsSnapshot = {
  rating: 4.5,
  count: 2,
  mapsUri: 'https://maps.google.com/?cid=1',
  reviews: [
    {
      author: 'Ana',
      authorUri: null,
      avatar: null,
      rating: 5,
      when: '2 weeks ago',
      text: 'Great.',
      translated: false,
    },
  ],
};

function get(query = '', method = 'GET'): Request {
  return new Request(`https://hucarbus.com/api/reviews/${query}`, {
    method,
    headers: { 'x-forwarded-for': '203.0.113.7' },
  });
}

function harness(
  options: { result?: PlacesResult; configured?: boolean; limit?: number; budget?: number } = {},
): { deps: ReviewsDeps; calls: [string, string][]; logs: string[] } {
  const calls: [string, string][] = [];
  const logs: string[] = [];
  const configured = options.configured ?? true;
  return {
    calls,
    logs,
    deps: {
      read: configured
        ? async (placeId, languageCode): Promise<PlacesResult> => {
            calls.push([placeId, languageCode]);
            return options.result ?? { ok: true, snapshot: SNAPSHOT };
          }
        : null,
      placeId: configured ? 'ChIJ_test' : null,
      limiter: createRateLimiter({ limit: options.limit ?? 10, windowMs: 60_000 }),
      budget: createDailyBudget(options.budget ?? 30),
      now: () => 1_800_000_000_000,
      log: (event, detail) => logs.push(detail ? `${event} ${JSON.stringify(detail)}` : event),
    },
  };
}

describe('handleReviews', () => {
  it('serves the live snapshot, never cached', async () => {
    const { deps } = harness();

    const response = await handleReviews(get('?locale=es'), deps);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ ok: true, ...SNAPSHOT });
  });

  it('asks Google in the visitor language', async () => {
    const { deps, calls } = harness();
    await handleReviews(get('?locale=es'), deps);
    expect(calls).toEqual([['ChIJ_test', 'es']]);
  });

  it.each([
    ['no locale', ''],
    ['an unknown locale', '?locale=fr'],
  ])('falls back to English with %s', async (_label, query) => {
    const { deps, calls } = harness();
    await handleReviews(get(query), deps);
    expect(calls[0][1]).toBe('en');
  });

  it('rejects anything but GET', async () => {
    const response = await handleReviews(get('', 'POST'), harness().deps);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  });

  it('answers unavailable, without calling Google, until it is configured', async () => {
    const { deps } = harness({ configured: false });
    const response = await handleReviews(get(), deps);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: 'unavailable' });
  });

  it('rate limits a single visitor before spending any budget', async () => {
    const { deps, calls } = harness({ limit: 1 });

    await handleReviews(get(), deps);
    const second = await handleReviews(get(), deps);

    expect(second.status).toBe(429);
    expect(calls).toHaveLength(1);
  });

  it('stops calling Google once the daily budget is spent', async () => {
    const { deps, calls, logs } = harness({ budget: 1 });

    await handleReviews(get(), deps);
    const response = await handleReviews(
      new Request('https://hucarbus.com/api/reviews/', {
        headers: { 'x-real-ip': '198.51.100.9' },
      }),
      deps,
    );

    expect(response.status).toBe(503);
    expect(calls).toHaveLength(1);
    expect(logs).toContain('reviews.budget_exhausted');
  });

  it('reports a Google failure as unavailable, with the status in the log only', async () => {
    const { deps, logs } = harness({ result: { ok: false, status: 403 } });

    const response = await handleReviews(get(), deps);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, error: 'unavailable' });
    expect(logs).toEqual(['reviews.places_failed {"status":403}']);
  });

  it('logs how many reviews were served, never their content', async () => {
    const { deps, logs } = harness();
    await handleReviews(get('?locale=en'), deps);
    expect(logs).toEqual(['reviews.served {"count":1,"locale":"en"}']);
  });

  it('shares one bucket among clients with no address', async () => {
    const { deps } = harness({ limit: 1 });
    const bare = (): Request => new Request('https://hucarbus.com/api/reviews/');
    expect((await handleReviews(bare(), deps)).status).toBe(200);
    expect((await handleReviews(bare(), deps)).status).toBe(429);
  });
});
