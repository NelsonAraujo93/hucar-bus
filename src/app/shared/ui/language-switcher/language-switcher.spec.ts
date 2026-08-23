import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SupportedLocale } from '../../../../shared/i18n/negotiate-locale';
import { LocaleService } from '../../../core/i18n/locale.service';
import { LanguageSwitcher } from './language-switcher';

class LocaleServiceStub {
  readonly currentLocale = signal<SupportedLocale>('es');
  readonly switched: SupportedLocale[] = [];

  switchTo(locale: SupportedLocale): void {
    this.switched.push(locale);
  }
}

async function render(
  active: SupportedLocale = 'es',
): Promise<{ host: HTMLElement; locale: LocaleServiceStub }> {
  const locale = new LocaleServiceStub();
  locale.currentLocale.set(active);
  TestBed.configureTestingModule({
    imports: [LanguageSwitcher],
    providers: [{ provide: LocaleService, useValue: locale }],
  });
  const fixture = TestBed.createComponent(LanguageSwitcher);
  await fixture.whenStable();
  return { host: fixture.nativeElement as HTMLElement, locale };
}

describe('LanguageSwitcher', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('labels the trigger with its purpose rather than relying on the visible text', async () => {
    const { host } = await render();
    const trigger = host.querySelector('button[aria-label]');
    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute('aria-label')).toBeTruthy();
  });

  it('shows the active language on the trigger', async () => {
    const { host } = await render();
    expect(host.querySelector('button')?.textContent?.trim()).toBe('Español');
  });

  it('shows the active language on the trigger when English is active', async () => {
    const { host } = await render('en');
    expect(host.querySelector('button')?.textContent?.trim()).toBe('English');
  });

  it('switches back to Spanish from an English page', async () => {
    const { host, locale } = await render('en');
    const spanish = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Español',
    );
    spanish?.click();
    expect(locale.switched).toEqual(['es']);
  });

  it('offers every supported language, each named in its own language', async () => {
    const { host } = await render();
    const labels = Array.from(host.querySelectorAll('[ngMenuItem], [role="menuitem"]')).map(
      (item) => item.textContent?.trim(),
    );
    expect(labels).toContain('Español');
    expect(labels).toContain('English');
  });

  it('never uses flags, which represent countries rather than languages', async () => {
    const { host } = await render();
    expect(host.innerHTML).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
  });

  it('delegates to the locale service when a language is chosen', async () => {
    const { host, locale } = await render();
    const english = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'English',
    );
    expect(english).toBeTruthy();
    english?.click();
    expect(locale.switched).toEqual(['en']);
  });
});
