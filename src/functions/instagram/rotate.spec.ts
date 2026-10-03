import { createInstagramRefresher, handleRotation, type RotationDeps } from './rotate';
import type { StoredToken, TokenStore } from './token-store';

const NOW = Date.UTC(2026, 9, 10, 5);
const DAY = 86_400_000;

function memoryStore(
  initial: StoredToken | null,
  writable = true,
): TokenStore & {
  value: StoredToken | null;
} {
  const store = {
    value: initial,
    read: async (): Promise<StoredToken | null> => store.value,
    write: async (value: StoredToken): Promise<boolean> => {
      if (!writable) return false;
      store.value = value;
      return true;
    },
  };
  return store;
}

function harness(overrides: Partial<RotationDeps> = {}): {
  deps: RotationDeps;
  alerts: string[];
  logs: string[];
  refreshed: string[];
  rebuilds: number[];
} {
  const alerts: string[] = [];
  const logs: string[] = [];
  const refreshed: string[] = [];
  const rebuilds: number[] = [];
  return {
    alerts,
    logs,
    refreshed,
    rebuilds,
    deps: {
      secret: 's3cret',
      store: memoryStore(null),
      seedToken: 'seed-token',
      refresh: async (token) => {
        refreshed.push(token);
        return { ok: true, token: `${token}+1`, expiresInDays: 60 };
      },
      rebuild: async () => {
        rebuilds.push(1);
        return true;
      },
      alert: async (reason) => {
        alerts.push(reason);
      },
      now: () => NOW,
      log: (event, detail) => logs.push(detail ? `${event} ${JSON.stringify(detail)}` : event),
      ...overrides,
    },
  };
}

function cron(secret = 's3cret'): Request {
  return new Request('https://hucarbus.com/api/cron/instagram/', {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe('handleRotation', () => {
  it.each([
    ['a wrong secret', cron('nope')],
    ['no secret', new Request('https://hucarbus.com/api/cron/instagram/')],
  ])('refuses a call with %s', async (_label, request) => {
    const { deps, rebuilds } = harness();
    expect((await handleRotation(request, deps)).status).toBe(401);
    expect(rebuilds).toEqual([]);
  });

  it('refuses everyone when no secret is configured', async () => {
    const { deps } = harness({ secret: null });
    expect((await handleRotation(cron(), deps)).status).toBe(401);
  });

  it('seeds an empty store without refreshing, then rebuilds', async () => {
    const store = memoryStore(null);
    const { deps, refreshed, rebuilds, logs } = harness({ store });

    const response = await handleRotation(cron(), deps);

    expect(await response.json()).toEqual({ ok: true, refreshed: false, rebuilt: true });
    expect(store.value).toEqual({ token: 'seed-token', refreshedAt: new Date(NOW).toISOString() });
    // A fresh seed may be under 24 hours old, which Instagram refuses.
    expect(refreshed).toEqual([]);
    expect(rebuilds).toHaveLength(1);
    expect(logs).toContain('instagram.rotation.seeded');
  });

  it('only rebuilds while the stored token is younger than a week', async () => {
    const store = memoryStore({ token: 't', refreshedAt: new Date(NOW - 6 * DAY).toISOString() });
    const { deps, refreshed, rebuilds } = harness({ store });

    await handleRotation(cron(), deps);

    expect(refreshed).toEqual([]);
    expect(rebuilds).toHaveLength(1);
  });

  it('refreshes a week-old token and stores the new one', async () => {
    const store = memoryStore({ token: 't', refreshedAt: new Date(NOW - 7 * DAY).toISOString() });
    const { deps, refreshed } = harness({ store });

    const response = await handleRotation(cron(), deps);

    expect(refreshed).toEqual(['t']);
    expect(store.value).toEqual({ token: 't+1', refreshedAt: new Date(NOW).toISOString() });
    expect(await response.json()).toEqual({ ok: true, refreshed: true, rebuilt: true });
  });

  it('refreshes when the stored date is unreadable', async () => {
    const store = memoryStore({ token: 't', refreshedAt: 'garbage' });
    const { deps, refreshed } = harness({ store });
    await handleRotation(cron(), deps);
    expect(refreshed).toEqual(['t']);
  });

  it('alerts the team when Instagram refuses, keeps the old token, still rebuilds', async () => {
    const old = { token: 't', refreshedAt: new Date(NOW - 8 * DAY).toISOString() };
    const store = memoryStore(old);
    const { deps, alerts, rebuilds } = harness({
      store,
      refresh: async () => ({ ok: false, status: 400 }),
    });

    await handleRotation(cron(), deps);

    expect(store.value).toEqual(old);
    expect(alerts).toEqual(['Instagram rechazó la renovación del token (estado 400).']);
    expect(rebuilds).toHaveLength(1);
  });

  it('alerts when the new token cannot be stored', async () => {
    const store = memoryStore(
      { token: 't', refreshedAt: new Date(NOW - 8 * DAY).toISOString() },
      false,
    );
    const { deps, alerts } = harness({ store });
    await handleRotation(cron(), deps);
    expect(alerts).toHaveLength(1);
  });

  it('alerts and stops when there is no store at all', async () => {
    const { deps, alerts, rebuilds } = harness({ store: null });
    expect((await handleRotation(cron(), deps)).status).toBe(503);
    expect(alerts).toHaveLength(1);
    expect(rebuilds).toEqual([]);
  });

  it('alerts and stops when there is no token anywhere', async () => {
    const { deps, alerts } = harness({ seedToken: null });
    expect((await handleRotation(cron(), deps)).status).toBe(503);
    expect(alerts).toHaveLength(1);
  });

  it('reports a failed rebuild without failing the run', async () => {
    const store = memoryStore({ token: 't', refreshedAt: new Date(NOW).toISOString() });
    const { deps } = harness({ store, rebuild: async () => false });
    expect(await (await handleRotation(cron(), deps)).json()).toEqual({
      ok: true,
      refreshed: false,
      rebuilt: false,
    });
  });

  it('never logs a token', async () => {
    const store = memoryStore({
      token: 'secret-token',
      refreshedAt: new Date(NOW - 8 * DAY).toISOString(),
    });
    const { deps, logs } = harness({ store });
    await handleRotation(cron(), deps);
    expect(logs.join('\n')).not.toContain('secret-token');
  });
});

describe('createInstagramRefresher', () => {
  it('calls the refresh endpoint and returns the new token', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      Response.json({ access_token: 'new', token_type: 'bearer', expires_in: 5_184_000 }),
    );

    const result = await createInstagramRefresher(fetchFn)('old');

    expect(result).toEqual({ ok: true, token: 'new', expiresInDays: 60 });
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://graph.instagram.com/refresh_access_token');
    expect(url.searchParams.get('grant_type')).toBe('ig_refresh_token');
    expect(url.searchParams.get('access_token')).toBe('old');
  });

  it.each([
    ['an error status', async () => new Response('{}', { status: 400 }), 400],
    ['a body without a token', async () => Response.json({}), 502],
    [
      'a network failure',
      async () => {
        throw new TypeError('fetch failed');
      },
      0,
    ],
  ])('reports %s', async (_label, answer, status) => {
    const fetchFn = vi.fn<typeof fetch>(answer);
    expect(await createInstagramRefresher(fetchFn)('old')).toEqual({ ok: false, status });
  });

  it('treats a missing lifetime as zero days', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => Response.json({ access_token: 'new' }));
    expect(await createInstagramRefresher(fetchFn)('old')).toEqual({
      ok: true,
      token: 'new',
      expiresInDays: 0,
    });
  });

  it('uses the global fetch when none is given', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ access_token: 'n' }));
    try {
      expect((await createInstagramRefresher()('old')).ok).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
