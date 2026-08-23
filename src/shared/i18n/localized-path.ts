import { SUPPORTED_LOCALES, type SupportedLocale } from './negotiate-locale';

/**
 * Rewrites a URL path so it points at the same page under a different locale.
 *
 * Pure, so switching locales can be tested without a browser. The locales are
 * separate compiled bundles, so this always produces a full-navigation target
 * rather than something the router could handle.
 */
export function localizedPath(pathname: string, target: SupportedLocale): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  const isLocale = (value: string): value is SupportedLocale =>
    SUPPORTED_LOCALES.some((locale) => locale === value);

  const rest = segments.length > 0 && isLocale(segments[0]) ? segments.slice(1) : segments;
  const suffix = rest.length > 0 ? `${rest.join('/')}` : '';

  // Keep the trailing slash on a bare locale root so /es/ stays /en/.
  return suffix.length > 0 ? `/${target}/${suffix}` : `/${target}/`;
}
