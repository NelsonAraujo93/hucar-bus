import type { TokenStore } from './token-store.js';

/**
 * The daily Instagram job, called by Vercel Cron.
 *
 * 1. Reads the current token from the store, seeding it from
 *    INSTAGRAM_ACCESS_TOKEN the first time.
 * 2. Once a week, refreshes it with Instagram (60 more days) and stores the
 *    new one -- a refresh returns a new token string, so storing it is the
 *    whole point.
 * 3. Triggers a production rebuild, which also brings in new posts.
 *
 * A failed refresh emails the team: the token keeps working until it
 * expires, so there are weeks to act, but only if someone is told.
 */

export interface RotationDeps {
  /** CRON_SECRET; Vercel sends it as a bearer token on every cron call. */
  readonly secret: string | null;
  readonly store: TokenStore | null;
  /** INSTAGRAM_ACCESS_TOKEN, used once to seed an empty store. */
  readonly seedToken: string | null;
  readonly refresh: (token: string) => Promise<RefreshResult>;
  /** Triggers the production rebuild; false if the hook is missing or failed. */
  readonly rebuild: () => Promise<boolean>;
  readonly alert: (reason: string) => Promise<void>;
  readonly now: () => number;
  readonly log: (event: string, detail?: Record<string, string | number | boolean>) => void;
}

export type RefreshResult =
  | { readonly ok: true; readonly token: string; readonly expiresInDays: number }
  | { readonly ok: false; readonly status: number };

/** Weekly keeps a 60-day token far from expiry without refreshing needlessly. */
export const REFRESH_EVERY_DAYS = 7;
const DAY_MS = 86_400_000;

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export async function handleRotation(request: Request, deps: RotationDeps): Promise<Response> {
  // Without a configured secret, nobody is authorised -- not everybody.
  if (deps.secret === null || request.headers.get('authorization') !== `Bearer ${deps.secret}`) {
    return reply(401, { ok: false });
  }
  if (deps.store === null) {
    deps.log('instagram.rotation.no_store');
    await deps.alert('No está configurada la base de datos donde se guarda el token.');
    return reply(503, { ok: false });
  }

  let stored = await deps.store.read();
  let refreshed = false;

  if (stored === null) {
    if (deps.seedToken === null) {
      deps.log('instagram.rotation.no_token');
      await deps.alert('No hay ningún token de Instagram guardado ni en INSTAGRAM_ACCESS_TOKEN.');
      return reply(503, { ok: false });
    }
    // First run: store the seed as-is. Instagram refuses to refresh a token
    // under 24 hours old, and a fresh seed is likely to be one.
    stored = { token: deps.seedToken, refreshedAt: new Date(deps.now()).toISOString() };
    await deps.store.write(stored);
    deps.log('instagram.rotation.seeded');
  } else {
    const ageDays = (deps.now() - Date.parse(stored.refreshedAt)) / DAY_MS;
    if (!(ageDays < REFRESH_EVERY_DAYS)) {
      const result = await deps.refresh(stored.token);
      if (result.ok) {
        const next = { token: result.token, refreshedAt: new Date(deps.now()).toISOString() };
        if (await deps.store.write(next)) {
          refreshed = true;
          deps.log('instagram.rotation.refreshed', { validDays: result.expiresInDays });
        } else {
          deps.log('instagram.rotation.store_failed');
          await deps.alert('Instagram renovó el token, pero no se pudo guardar.');
        }
      } else {
        deps.log('instagram.rotation.refresh_failed', { status: result.status });
        await deps.alert(`Instagram rechazó la renovación del token (estado ${result.status}).`);
      }
    }
  }

  const rebuilt = await deps.rebuild();
  deps.log('instagram.rotation.done', { refreshed, rebuilt });
  return reply(200, { ok: true, refreshed, rebuilt });
}

/** Instagram's refresh endpoint. The token travels in the URL, so it is never logged. */
export function createInstagramRefresher(fetchFn: typeof fetch = fetch): RotationDeps['refresh'] {
  return async (token) => {
    try {
      const url = new URL('https://graph.instagram.com/refresh_access_token');
      url.searchParams.set('grant_type', 'ig_refresh_token');
      url.searchParams.set('access_token', token);
      const response = await fetchFn(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) {
        return { ok: false, status: response.status };
      }
      const body = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
      if (typeof body.access_token !== 'string') {
        return { ok: false, status: 502 };
      }
      const seconds = typeof body.expires_in === 'number' ? body.expires_in : 0;
      return { ok: true, token: body.access_token, expiresInDays: Math.round(seconds / 86_400) };
    } catch {
      return { ok: false, status: 0 };
    }
  };
}
