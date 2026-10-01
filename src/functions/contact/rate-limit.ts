/**
 * A per-key sliding-window limiter, held in the function instance's memory.
 *
 * Best effort, and knowingly so. Each warm instance keeps its own counts and a
 * cold start forgets them, so a determined sender spread across instances gets
 * through. What it does stop is the common case: one client hammering the form
 * in a loop, which lands on the same warm instance. A shared store (Redis, KV)
 * is the upgrade if the inbox ever shows that this is not enough.
 */
export interface RateLimiter {
  /** Records an attempt and reports whether it is within the limit. */
  hit(key: string, now: number): boolean;
}

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
  /**
   * Distinct keys kept before the oldest is dropped, so a flood of spoofed
   * addresses cannot grow the instance's memory without bound.
   */
  readonly maxKeys?: number;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: RateLimitOptions): RateLimiter {
  const attempts = new Map<string, number[]>();

  return {
    hit(key: string, now: number): boolean {
      const recent = (attempts.get(key) ?? []).filter((at) => now - at < windowMs);
      recent.push(now);

      // Re-inserting moves the key to the end, so iteration order is oldest
      // first and eviction drops the least recently seen sender.
      attempts.delete(key);
      attempts.set(key, recent);
      if (attempts.size > maxKeys) {
        const oldest = attempts.keys().next().value;
        if (oldest !== undefined) {
          attempts.delete(oldest);
        }
      }

      return recent.length <= limit;
    },
  };
}
