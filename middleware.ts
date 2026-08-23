import { readLocaleCookie } from './src/shared/i18n/locale-cookie';
import { negotiateLocale } from './src/shared/i18n/negotiate-locale';

/**
 * Only the bare root is negotiated. /es/..., /en/... and every static asset
 * must pass through untouched -- intercepting them would break asset loading
 * and trap anyone who has already chosen a locale.
 */
export const config = {
  matcher: '/',
};

export default function middleware(request: Request): Response {
  const locale = negotiateLocale(
    request.headers.get('accept-language'),
    readLocaleCookie(request.headers.get('cookie')),
  );

  // Preserve the query string so campaign parameters on links to the bare
  // root survive the redirect.
  const { search } = new URL(request.url);

  return new Response(null, {
    status: 307,
    headers: {
      // 307, never 308: the target is content-negotiated and may legitimately
      // differ between requests. Browsers cache a permanent redirect very
      // aggressively and it is painful to undo.
      location: `/${locale}/${search}`,
      // The response body depends on both inputs, so shared caches must key on
      // them. Cookie is included as well as Accept-Language because an explicit
      // choice overrides the browser's -- without it, one visitor's chosen
      // locale could be served to another.
      vary: 'Accept-Language, Cookie',
      'cache-control': 'no-store',
    },
  });
}
