import { LOCALE_COOKIE } from './negotiate-locale';

/**
 * Extracts the locale cookie from a raw Cookie header.
 *
 * Kept out of the middleware so it can be unit tested without an edge runtime,
 * for the same reason locale negotiation is.
 *
 * Returns null when the header is absent or carries no such cookie. The value
 * is not validated here -- negotiateLocale decides whether it is usable.
 */
export function readLocaleCookie(cookieHeader: string | null): string | null {
  if (cookieHeader === null) {
    return null;
  }

  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const name = pair.slice(0, separator).trim();
    if (name !== LOCALE_COOKIE) {
      continue;
    }
    // Values may be percent-encoded; a malformed encoding should not throw.
    const raw = pair.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return null;
}
