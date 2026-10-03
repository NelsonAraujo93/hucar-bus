import { TestBed } from '@angular/core/testing';
import { FETCH } from '../http/fetch';
import { HttpInstagramGateway } from './http-instagram-gateway';

const POST = {
  id: '1',
  permalink: 'https://www.instagram.com/p/x/',
  caption: 'Hola',
  image: { webp: '/instagram/post-1.webp', jpg: '/instagram/post-1.jpg', width: 640, height: 640 },
};

function setup(answer: () => Promise<Response>): {
  gateway: HttpInstagramGateway;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchFn = vi.fn<typeof fetch>(answer);
  TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetchFn }] });
  return { gateway: TestBed.inject(HttpInstagramGateway), fetchFn };
}

describe('HttpInstagramGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('reads the feed file the build wrote, from this site', async () => {
    const { gateway, fetchFn } = setup(async () =>
      Response.json({ fetchedAt: '2026-10-03T00:00:00Z', posts: [POST] }),
    );
    expect(await gateway.load()).toEqual([POST]);
    expect(fetchFn).toHaveBeenCalledWith('/instagram/feed.json');
  });

  it.each([
    ['missing', async () => new Response('', { status: 404 })],
    ['not JSON', async () => new Response('<html>')],
    ['shaped wrongly', async () => Response.json({ posts: 'nope' })],
    [
      'unreachable',
      async () => {
        throw new TypeError('Failed to fetch');
      },
    ],
  ])('returns no posts when the feed is %s', async (_label, answer) => {
    const { gateway } = setup(answer);
    expect(await gateway.load()).toEqual([]);
  });
});
