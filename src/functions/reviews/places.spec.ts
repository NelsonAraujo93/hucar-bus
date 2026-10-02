import { createPlacesReader } from './places';

const PLACE = {
  rating: 4.7,
  userRatingCount: 3,
  googleMapsUri: 'https://maps.google.com/?cid=1',
  reviews: [
    {
      rating: 5,
      relativePublishTimeDescription: '2 weeks ago',
      text: { text: 'Great driver, very punctual.', languageCode: 'en' },
      originalText: { text: 'Gran conductor, muy puntual.', languageCode: 'es' },
      authorAttribution: {
        displayName: 'Ana',
        uri: 'https://www.google.com/maps/contrib/1',
        photoUri: 'https://lh3.googleusercontent.com/a/abc=s128',
      },
    },
    {
      rating: 3,
      relativePublishTimeDescription: 'a month ago',
      text: { text: 'Fine.', languageCode: 'en' },
      originalText: { text: 'Fine.', languageCode: 'en' },
      authorAttribution: { displayName: 'Tom' },
    },
  ],
};

function image(bytes = 10): Response {
  return new Response(new Uint8Array(bytes), { headers: { 'content-type': 'image/jpeg' } });
}

function reader(handler: (url: string) => Response | Promise<Response>): {
  read: ReturnType<typeof createPlacesReader>;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchFn = vi.fn<typeof fetch>(async (input) => handler(String(input)));
  return { read: createPlacesReader('key', fetchFn), fetchFn };
}

describe('createPlacesReader', () => {
  it('asks Google for exactly the fields the page shows, in the visitor language', async () => {
    const { read, fetchFn } = reader((url) =>
      url.startsWith('https://places') ? Response.json(PLACE) : image(),
    );

    await read('ChIJ_test', 'en');

    const [url, init] = fetchFn.mock.calls[0];
    expect(String(url)).toBe('https://places.googleapis.com/v1/places/ChIJ_test?languageCode=en');
    const headers = init?.headers as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toBe('key');
    expect(headers['X-Goog-FieldMask']).toBe('rating,userRatingCount,googleMapsUri,reviews');
  });

  it('maps the place into the public snapshot, keeping every review in order', async () => {
    const { read } = reader((url) =>
      url.startsWith('https://places') ? Response.json(PLACE) : image(),
    );

    const result = await read('ChIJ_test', 'en');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot).toMatchObject({
      rating: 4.7,
      count: 3,
      mapsUri: 'https://maps.google.com/?cid=1',
    });
    expect(result.snapshot.reviews.map((review) => review.author)).toEqual(['Ana', 'Tom']);
    expect(result.snapshot.reviews[1].rating).toBe(3);
  });

  it('marks a review Google translated, and not one it did not', async () => {
    const { read } = reader((url) =>
      url.startsWith('https://places') ? Response.json(PLACE) : image(),
    );
    const result = await read('ChIJ_test', 'en');
    if (!result.ok) throw new Error('expected ok');

    expect(result.snapshot.reviews.map((review) => review.translated)).toEqual([true, false]);
  });

  it('inlines the author photo so the browser never contacts Google', async () => {
    const { read } = reader((url) =>
      url.startsWith('https://places') ? Response.json(PLACE) : image(4),
    );
    const result = await read('ChIJ_test', 'en');
    if (!result.ok) throw new Error('expected ok');

    expect(result.snapshot.reviews[0].avatar).toBe('data:image/jpeg;base64,AAAAAA==');
    expect(result.snapshot.reviews[1].avatar).toBeNull();
  });

  it.each([
    ['another host', 'https://evil.example/a.jpg'],
    ['a lookalike host', 'https://googleusercontent.com.evil.example/a.jpg'],
    ['plain http', 'http://lh3.googleusercontent.com/a.jpg'],
    ['not a URL', 'nonsense'],
  ])('never fetches an avatar from %s', async (_label, photoUri) => {
    const place = {
      ...PLACE,
      reviews: [{ ...PLACE.reviews[0], authorAttribution: { displayName: 'Ana', photoUri } }],
    };
    const { read, fetchFn } = reader(() => Response.json(place));

    const result = await read('ChIJ_test', 'en');

    expect(fetchFn).toHaveBeenCalledTimes(1);
    if (!result.ok) throw new Error('expected ok');
    expect(result.snapshot.reviews[0].avatar).toBeNull();
  });

  it.each([
    ['too large', image(50_000)],
    ['not an image', new Response('<html>', { headers: { 'content-type': 'text/html' } })],
    ['an error', new Response('', { status: 404, headers: { 'content-type': 'image/jpeg' } })],
  ])('drops an avatar that is %s', async (_label, answer) => {
    const { read } = reader((url) =>
      url.startsWith('https://places') ? Response.json(PLACE) : answer,
    );
    const result = await read('ChIJ_test', 'en');
    if (!result.ok) throw new Error('expected ok');
    expect(result.snapshot.reviews[0].avatar).toBeNull();
  });

  it('survives an avatar request that throws', async () => {
    const { read } = reader((url) => {
      if (url.startsWith('https://places')) return Response.json(PLACE);
      throw new TypeError('fetch failed');
    });
    const result = await read('ChIJ_test', 'en');
    expect(result.ok).toBe(true);
  });

  it('skips reviews without text, author or rating, and clamps the rating', async () => {
    const place = {
      reviews: [
        { rating: 5, authorAttribution: { displayName: 'No text' } },
        { rating: 5, text: { text: 'No author' } },
        { text: { text: 'No rating' }, authorAttribution: { displayName: 'X' } },
        { rating: 9, text: { text: 'Odd' }, authorAttribution: { displayName: 'Y' } },
      ],
    };
    const { read } = reader(() => Response.json(place));
    const result = await read('ChIJ_test', 'es');
    if (!result.ok) throw new Error('expected ok');

    expect(result.snapshot.reviews.map((review) => [review.author, review.rating])).toEqual([
      ['Y', 5],
    ]);
    expect(result.snapshot).toMatchObject({ rating: null, count: 0, mapsUri: null });
  });

  it.each([
    ['an error status', () => new Response('{}', { status: 403 }), 403],
    ['unreadable JSON', () => new Response('<html>'), 502],
    [
      'a network failure',
      () => {
        throw new TypeError('fetch failed');
      },
      0,
    ],
  ])('reports %s', async (_label, answer, status) => {
    const { read } = reader(answer);
    expect(await read('ChIJ_test', 'en')).toEqual({ ok: false, status });
  });

  it('uses the global fetch when none is given', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({}));
    try {
      expect((await createPlacesReader('key')('ChIJ_test', 'en')).ok).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
