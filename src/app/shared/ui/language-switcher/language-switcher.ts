import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { SupportedLocale } from '../../../../shared/i18n/negotiate-locale';
import { LocaleService } from '../../../core/i18n/locale.service';
import { SUPPORTED_LOCALES } from '../../../core/i18n/locale.tokens';

/**
 * Endonyms -- each language named in its own language.
 *
 * These are deliberately not translatable: a Spanish speaker looking for
 * English should see "English", not "Inglés". Flags are never used, since they
 * represent countries rather than languages.
 */
const LOCALE_ENDONYMS: Record<SupportedLocale, string> = {
  es: 'Español',
  en: 'English',
};

@Component({
  selector: 'hb-language-switcher',
  imports: [Menu, MenuItem, MenuTrigger],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  private readonly localeService = inject(LocaleService);

  protected readonly locales = inject(SUPPORTED_LOCALES);
  protected readonly currentLabel = computed(
    () => LOCALE_ENDONYMS[this.localeService.currentLocale()],
  );

  protected labelFor(locale: SupportedLocale): string {
    return LOCALE_ENDONYMS[locale];
  }

  protected switchTo(locale: SupportedLocale): void {
    this.localeService.switchTo(locale);
  }
}
