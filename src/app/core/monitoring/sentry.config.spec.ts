import { environmentFor } from './sentry.config';

describe('environmentFor', () => {
  it.each([
    ['hucarbus.com', 'production'],
    ['www.hucarbus.com', 'production'],
    ['hucar-bus-git-dev-nelson-araujos-projects.vercel.app', 'preview'],
    ['hucar-abc123-nelson-araujos-projects.vercel.app', 'preview'],
    ['localhost', 'development'],
    ['127.0.0.1', 'development'],
    // The case that was mislabelled: a dev server opened from a phone.
    ['192.168.1.135', 'development'],
    ['', 'development'],
    // Not ours, so never production -- a copy of the site would not pollute it.
    ['hucarbus.com.evil.example', 'development'],
  ])('names %s as %s', (hostname, expected) => {
    expect(environmentFor(hostname)).toBe(expected);
  });
});
