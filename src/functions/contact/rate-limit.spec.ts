import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit within the window, then refuses', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000 });

    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('a', 100)).toBe(true);
    expect(limiter.hit('a', 200)).toBe(false);
  });

  it('forgets attempts once they leave the window', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });

    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('a', 999)).toBe(false);
    expect(limiter.hit('a', 2_000)).toBe(true);
  });

  it('counts refused attempts too, so hammering extends the block', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });

    limiter.hit('a', 0);
    limiter.hit('a', 900);
    expect(limiter.hit('a', 1_500)).toBe(false);
  });

  it('keeps keys independent', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });

    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('b', 0)).toBe(true);
  });

  it('evicts the least recently seen key beyond its capacity', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000, maxKeys: 2 });

    limiter.hit('a', 0);
    limiter.hit('b', 1);
    limiter.hit('a', 2); // a is now the most recent; b is the oldest
    limiter.hit('c', 3); // evicts b

    // a survived with its history; b comes back as a stranger. Checked in this
    // order because each hit can itself evict.
    expect(limiter.hit('a', 4)).toBe(false);
    expect(limiter.hit('b', 5)).toBe(true);
  });
});
