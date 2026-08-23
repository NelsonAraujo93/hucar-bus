import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, inject, Injectable } from '@angular/core';
import { localizedPath } from '../../../shared/i18n/localized-path';
import { LOCALE_TAGS, type SupportedLocale } from '../../../shared/i18n/negotiate-locale';
import { LocaleService } from '../i18n/locale.service';
import { SUPPORTED_LOCALES } from '../i18n/locale.tokens';
import { SITE_ORIGIN } from './seo.tokens';

/** Open Graph writes locales with an underscore: es_ES rather than es-ES. */
function toOpenGraphLocale(locale: SupportedLocale): string {
  return LOCALE_TAGS[locale].replace('-', '_');
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly origin = inject(SITE_ORIGIN);
  private readonly locales = inject(SUPPORTED_LOCALES);
  private readonly localeService = inject(LocaleService);

  /**
   * Applies title, canonical and the full set of locale alternates.
   *
   * Deliberately not guarded with isPlatformBrowser: these tags must be present
   * in the prerendered HTML, which means running during SSR is the point.
   */
  setPage(page: { title: string; description?: string; path?: string }): void {
    this.title.setTitle(page.title);

    if (page.description !== undefined) {
      this.meta.updateTag({ name: 'description', content: page.description });
    }

    const current = this.localeService.currentLocale();
    const pathname = page.path ?? this.currentPathname(current);

    // Self-referencing canonical: each locale points at itself, never at the
    // other one, or the two would compete for the same ranking.
    this.setManagedLink('hb-canonical', {
      rel: 'canonical',
      href: this.absolute(localizedPath(pathname, current)),
    });

    for (const locale of this.locales) {
      this.setManagedLink(`hb-alt-${locale}`, {
        rel: 'alternate',
        hreflang: LOCALE_TAGS[locale],
        href: this.absolute(localizedPath(pathname, locale)),
      });
    }

    // x-default points at the negotiating entry point, not at a locale, so
    // crawlers know where an unmatched visitor is sent.
    this.setManagedLink('hb-alt-x-default', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: this.absolute('/'),
    });

    this.meta.updateTag({ property: 'og:locale', content: toOpenGraphLocale(current) });
    this.meta.removeTag("property='og:locale:alternate'");
    for (const locale of this.locales) {
      if (locale !== current) {
        this.meta.addTag({ property: 'og:locale:alternate', content: toOpenGraphLocale(locale) });
      }
    }
    this.meta.updateTag({
      property: 'og:url',
      content: this.absolute(localizedPath(pathname, current)),
    });
  }

  private currentPathname(current: SupportedLocale): string {
    return this.document.location?.pathname ?? `/${current}/`;
  }

  private absolute(path: string): string {
    return `${this.origin}${path}`;
  }

  /**
   * Creates or replaces a managed link tag.
   *
   * Elements are addressed by a deterministic id and getElementById rather than
   * by attribute selector. An earlier version used
   * head.querySelector('link[rel="canonical"]') and the tags silently failed to
   * appear in the prerendered HTML, while an identical plain appendChild
   * survived -- so the attribute-selector lookup is not reliable in the
   * prerender DOM. Ids are, and they also give us a precise handle for
   * replacing our own tags without touching any others.
   */
  private setManagedLink(id: string, attributes: Record<string, string>): void {
    const existing = this.document.getElementById(id);
    if (existing !== null) {
      existing.remove();
    }

    const link = this.document.createElement('link');
    link.setAttribute('id', id);
    for (const [name, value] of Object.entries(attributes)) {
      link.setAttribute(name, value);
    }
    this.document.head.appendChild(link);
  }
}
