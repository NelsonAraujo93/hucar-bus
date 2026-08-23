/**
 * Locale negotiation, kept free of any edge-runtime dependency so it can be
 * unit tested directly. The middleware is a thin wrapper around this.
 */

export const SUPPORTED_LOCALES = ['es', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Where an unmatched visitor lands. English rather than Spanish: the
 * English-speaking market is the larger share of customers, so an unrecognised
 * browser language is more likely to be an English speaker than a Spanish one.
 */
export const FALLBACK_LOCALE: SupportedLocale = 'en';

/**
 * The full BCP 47 tag for each locale, matching the codes in angular.json.
 * Used wherever a bare `es`/`en` is not specific enough -- hreflang, og:locale
 * and the html lang attribute all want the regional form.
 */
export const LOCALE_TAGS: Record<SupportedLocale, string> = {
  es: 'es-ES',
  en: 'en-GB',
};

/** Name of the cookie holding an explicit user choice. */
export const LOCALE_COOKIE = 'hb_locale';

interface RankedTag {
  readonly locale: SupportedLocale;
  readonly quality: number;
  /** Original position, used to break q-value ties in header order. */
  readonly index: number;
}

/**
 * Maps a language tag onto a supported locale by its primary subtag, so
 * `en-GB`, `en_US` and `EN` all resolve to `en`. Returns null for anything
 * unsupported, including the `*` wildcard.
 */
export function toSupportedLocale(tag: string): SupportedLocale | null {
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.find((locale) => locale === primary) ?? null;
}

/**
 * Reads the q-value from a tag's parameters. Absent means 1 per RFC 9110. A
 * malformed value is treated as unusable rather than assumed to be 1 -- if we
 * cannot rank an entry we should not let it outrank a well-formed one.
 */
function parseQuality(parameters: readonly string[]): number {
  const qParameter = parameters.find((parameter) =>
    parameter.trim().toLowerCase().startsWith('q='),
  );
  if (qParameter === undefined) {
    return 1;
  }
  const quality = Number.parseFloat(qParameter.trim().slice(2));
  return Number.isNaN(quality) ? 0 : quality;
}

function parseTag(part: string, index: number): RankedTag | null {
  const [tag, ...parameters] = part.split(';');
  const locale = toSupportedLocale(tag);
  if (locale === null) {
    return null;
  }
  const quality = parseQuality(parameters);
  // q=0 explicitly means "not acceptable".
  if (quality <= 0) {
    return null;
  }
  return { locale, quality, index };
}

/**
 * Resolves the locale to serve, in priority order:
 *
 * 1. A valid `hb_locale` cookie -- an explicit choice beats browser settings.
 * 2. `Accept-Language`, honouring q-values rather than header order.
 * 3. {@link FALLBACK_LOCALE}.
 */
export function negotiateLocale(
  acceptLanguage: string | null,
  cookieLocale: string | null,
): SupportedLocale {
  if (cookieLocale !== null) {
    const chosen = toSupportedLocale(cookieLocale);
    if (chosen !== null) {
      return chosen;
    }
  }

  if (acceptLanguage !== null) {
    const ranked = acceptLanguage
      .split(',')
      .map((part, index) => parseTag(part, index))
      .filter((tag): tag is RankedTag => tag !== null)
      .sort((a, b) => b.quality - a.quality || a.index - b.index);

    if (ranked.length > 0) {
      return ranked[0].locale;
    }
  }

  return FALLBACK_LOCALE;
}
