import { TestBed } from '@angular/core/testing';
import { FETCH } from '../http/fetch';
import { HttpReviewsGateway } from './http-reviews-gateway';

const SNAPSHOT = { rating: 4.5, count: 2, mapsUri: null, reviews: [] };

function setup(answer: () => Promise<Response>): {
  gateway: HttpReviewsGateway;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchFn = vi.fn<typeof fetch>(answer);
  TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetchFn }] });
  return { gateway: TestBed.inject(HttpReviewsGateway), fetchFn };
}

describe('HttpReviewsGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('requests the endpoint in the visitor language, slash included', async () => {
    const { gateway, fetchFn } = setup(async () => Response.json({ ok: true, ...SNAPSHOT }));
    await gateway.load('es');
    expect(fetchFn).toHaveBeenCalledWith('/api/reviews/?locale=es');
  });

  it('returns the snapshot without the envelope', async () => {
    const { gateway } = setup(async () => Response.json({ ok: true, ...SNAPSHOT }));
    expect(await gateway.load('en')).toEqual(SNAPSHOT);
  });

  it.each([
    [
      'unavailable',
      async () => Response.json({ ok: false, error: 'unavailable' }, { status: 503 }),
    ],
    [
      'rate limited',
      async () => Response.json({ ok: false, error: 'rate_limited' }, { status: 429 }),
    ],
    ['not JSON', async () => new Response('<html>')],
    [
      'a network failure',
      async () => {
        throw new TypeError('Failed to fetch');
      },
    ],
  ])('returns null when %s', async (_label, answer) => {
    const { gateway } = setup(answer);
    expect(await gateway.load('en')).toBeNull();
  });
});
