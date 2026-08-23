import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { SupportedLocale } from '../../../../shared/i18n/negotiate-locale';
import { LocaleService } from '../../../core/i18n/locale.service';
import { SUPPORTED_LOCALES } from '../../../core/i18n/locale.tokens';

export type LanguageSwitcherTone = 'light' | 'dark';

interface LocaleOption {
  readonly code: SupportedLocale;
  /** Short code shown in the pill. */
  readonly label: string;
  /** Full name, used as the link title. */
  readonly name: string;
  readonly href: string;
  readonly active: boolean;
}

/**
 * Endonyms again -- each language named in its own language, never translated
 * and never a flag.
 */
const LOCALE_NAMES: Record<SupportedLocale, { label: string; name: string }> = {
  es: { label: 'ES', name: 'Español' },
  en: { label: 'EN', name: 'English' },
};

/**
 * Segmented ES / EN control.
 *
 * Rendered as anchors rather than the design's buttons. Each locale is a
 * separate URL and a separate compiled bundle, so links are what actually
 * happens: they are crawlable, consistent with the hreflang tags, open in a new
 * tab, and work with JavaScript disabled. Clicking also records the choice in a
 * cookie so the middleware honours it at the bare root next time, but that is
 * an enhancement rather than the mechanism.
 */
@Component({
  selector: 'hb-language-switcher',
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[class.is-full]': 'full()',
  },
})
export class LanguageSwitcher {
  private readonly localeService = inject(LocaleService);
  private readonly locales = inject(SUPPORTED_LOCALES);

  readonly tone = input<LanguageSwitcherTone>('light');

  /** Stretches to fill its container, for the mobile drawer. */
  readonly full = input(false);

  protected readonly options = computed<readonly LocaleOption[]>(() => {
    const current = this.localeService.currentLocale();
    return this.locales.map((code) => ({
      code,
      label: LOCALE_NAMES[code].label,
      name: LOCALE_NAMES[code].name,
      href: this.localeService.pathFor(code),
      active: code === current,
    }));
  });

  protected persist(locale: SupportedLocale): void {
    this.localeService.persist(locale);
  }
}
