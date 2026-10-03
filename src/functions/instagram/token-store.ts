/**
 * Where the current Instagram token lives between runs: one key in the
 * project's Upstash Redis database, read and written over its REST API.
 *
 * Upstash keys are scoped to that one database -- unlike a Vercel API token,
 * which could change anything in the account -- and the database holds
 * nothing else.
 */

/** Also read by scripts/fetch-instagram.mjs, which cannot import this file. */
export const TOKEN_KEY = 'instagram:token';

export interface StoredToken {
  readonly token: string;
  /** ISO time of the last successful refresh, or of first storage. */
  readonly refreshedAt: string;
}

export interface TokenStore {
  read(): Promise<StoredToken | null>;
  write(value: StoredToken): Promise<boolean>;
}

export function createTokenStore(
  restUrl: string,
  restToken: string,
  fetchFn: typeof fetch = fetch,
): TokenStore {
  async function command(args: readonly string[]): Promise<unknown> {
    const response = await fetchFn(restUrl, {
      method: 'POST',
      headers: { authorization: `Bearer ${restToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`store status ${response.status}`);
    }
    return ((await response.json()) as { result?: unknown }).result;
  }

  return {
    async read(): Promise<StoredToken | null> {
      try {
        const raw = await command(['GET', TOKEN_KEY]);
        if (typeof raw !== 'string') {
          return null;
        }
        const parsed = JSON.parse(raw) as Partial<StoredToken>;
        return typeof parsed.token === 'string' && typeof parsed.refreshedAt === 'string'
          ? { token: parsed.token, refreshedAt: parsed.refreshedAt }
          : null;
      } catch {
        return null;
      }
    },
    async write(value: StoredToken): Promise<boolean> {
      try {
        return (await command(['SET', TOKEN_KEY, JSON.stringify(value)])) === 'OK';
      } catch {
        return false;
      }
    },
  };
}
