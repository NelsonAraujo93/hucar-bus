import { createTokenStore, TOKEN_KEY } from './token-store';

const VALUE = { token: 't', refreshedAt: '2026-10-03T08:00:00.000Z' };

function store(answer: () => Promise<Response>): {
  tokens: ReturnType<typeof createTokenStore>;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchFn = vi.fn<typeof fetch>(answer);
  return { tokens: createTokenStore('https://kv.example', 'kv-key', fetchFn), fetchFn };
}

describe('createTokenStore', () => {
  it('reads the token with a GET command, authenticated', async () => {
    const { tokens, fetchFn } = store(async () => Response.json({ result: JSON.stringify(VALUE) }));

    expect(await tokens.read()).toEqual(VALUE);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://kv.example');
    expect((init?.headers as Record<string, string>)['authorization']).toBe('Bearer kv-key');
    expect(JSON.parse(init?.body as string)).toEqual(['GET', TOKEN_KEY]);
  });

  it('writes the token with a SET command', async () => {
    const { tokens, fetchFn } = store(async () => Response.json({ result: 'OK' }));

    expect(await tokens.write(VALUE)).toBe(true);
    expect(JSON.parse(fetchFn.mock.calls[0][1]?.body as string)).toEqual([
      'SET',
      TOKEN_KEY,
      JSON.stringify(VALUE),
    ]);
  });

  it.each([
    ['an empty key', async () => Response.json({ result: null })],
    ['unparseable content', async () => Response.json({ result: 'not json' })],
    ['the wrong shape', async () => Response.json({ result: JSON.stringify({ token: 1 }) })],
    ['an error status', async () => new Response('', { status: 500 })],
    [
      'a network failure',
      async () => {
        throw new TypeError('fetch failed');
      },
    ],
  ])('reads nothing from %s', async (_label, answer) => {
    expect(await store(answer).tokens.read()).toBeNull();
  });

  it.each([
    ['an unexpected reply', async () => Response.json({ result: 'NOPE' })],
    ['an error status', async () => new Response('', { status: 401 })],
  ])('reports a failed write on %s', async (_label, answer) => {
    expect(await store(answer).tokens.write(VALUE)).toBe(false);
  });

  it('uses the global fetch when none is given', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ result: 'OK' }));
    try {
      expect(await createTokenStore('https://kv.example', 'k').write(VALUE)).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
