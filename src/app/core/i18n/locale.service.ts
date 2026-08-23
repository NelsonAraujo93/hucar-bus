import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  DOCUMENT,
  inject,
  Injectable,
  LOCALE_ID,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { localizedPath } from '../../../shared/i18n/localized-path';
import {
  FALLBACK_LOCALE,
  LOCALE_COOKIE,
  toSupportedLocale,
  type SupportedLocale,
} from '../../../shared/i18n/negotiate-locale';
import { SUPPORTED_LOCALES } from './locale.tokens';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly supportedLocales = inject(SUPPORTED_LOCALES);

  /**
   * The locale this bundle was compiled for. LOCALE_ID is fixed per build, so
   * this never changes at runtime -- switching locales is a full navigation
   * into a different bundle, not a state change.
   */
  readonly currentLocale = signal<SupportedLocale>(
    toSupportedLocale(inject(LOCALE_ID)) ?? FALLBACK_LOCALE,
  );

  readonly alternateLocales = computed<readonly SupportedLocale[]>(() =>
    this.supportedLocales.filter((locale) => locale !== this.currentLocale()),
  );

  /**
   * Persists the choice and navigates to the equivalent page in the other
   * locale.
   *
   * This is a full page load on purpose: each locale is a separately compiled
   * bundle, so Angular's router cannot cross between them.
   */
  switchTo(locale: SupportedLocale): void {
    // Must not run during prerendering, where neither cookies nor navigation
    // exist.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;

    const view = this.document.defaultView;
    if (view === null) {
      return;
    }

    const { pathname, search, hash } = view.location;
    view.location.assign(`${localizedPath(pathname, locale)}${search}${hash}`);
  }
}
