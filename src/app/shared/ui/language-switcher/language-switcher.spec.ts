import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SupportedLocale } from '../../../../shared/i18n/negotiate-locale';
import { LocaleService } from '../../../core/i18n/locale.service';
import { LanguageSwitcher, type LanguageSwitcherTone } from './language-switcher';

class LocaleServiceStub {
  readonly currentLocale = signal<SupportedLocale>('es');
  readonly persisted: SupportedLocale[] = [];

  pathFor(locale: SupportedLocale): string {
    return `/${locale}/contacto`;
  }

  persist(locale: SupportedLocale): void {
    this.persisted.push(locale);
  }
}

async function render(options?: {
  active?: SupportedLocale;
  tone?: LanguageSwitcherTone;
  full?: boolean;
}): Promise<{ host: HTMLElement; locale: LocaleServiceStub }> {
  const locale = new LocaleServiceStub();
  locale.currentLocale.set(options?.active ?? 'es');
  TestBed.configureTestingModule({
    imports: [LanguageSwitcher],
    providers: [{ provide: LocaleService, useValue: locale }],
  });
  const fixture = TestBed.createComponent(LanguageSwitcher);
  if (options?.tone !== undefined) {
    fixture.componentRef.setInput('tone', options.tone);
  }
  if (options?.full !== undefined) {
    fixture.componentRef.setInput('full', options.full);
  }
  await fixture.whenStable();
  return { host: fixture.nativeElement as HTMLElement, locale };
}

function optionFor(host: HTMLElement, label: string): HTMLAnchorElement | undefined {
  return Array.from(host.querySelectorAll('a')).find((a) => a.textContent?.trim() === label);
}

describe('LanguageSwitcher', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('semantics', () => {
    it('renders real links, so both locales are crawlable', async () => {
      const { host } = await render();
      const links = host.querySelectorAll('a[href]');
      expect(links).toHaveLength(2);
      expect(optionFor(host, 'ES')?.getAttribute('href')).toBe('/es/contacto');
      expect(optionFor(host, 'EN')?.getAttribute('href')).toBe('/en/contacto');
    });

    it('declares the target language on each link', async () => {
      const { host } = await render();
      expect(optionFor(host, 'EN')?.getAttribute('hreflang')).toBe('en');
    });

    it('groups the options with a translated label', async () => {
      const { host } = await render();
      const group = host.querySelector('[role="group"]');
      expect(group).toBeTruthy();
      expect(group?.getAttribute('aria-label')).toBeTruthy();
    });

    it('marks the active locale with aria-current, not aria-pressed', async () => {
      // aria-pressed suits a toggle button; these are links to distinct URLs.
      const { host } = await render({ active: 'es' });
      expect(optionFor(host, 'ES')?.getAttribute('aria-current')).toBe('true');
      expect(optionFor(host, 'EN')?.getAttribute('aria-current')).toBeNull();
    });

    it('follows the active locale when English is current', async () => {
      const { host } = await render({ active: 'en' });
      expect(optionFor(host, 'EN')?.getAttribute('aria-current')).toBe('true');
      expect(optionFor(host, 'ES')?.getAttribute('aria-current')).toBeNull();
    });
  });

  describe('naming', () => {
    it('shows each language in its own language and never a flag', async () => {
      const { host } = await render();
      expect(optionFor(host, 'ES')?.getAttribute('title')).toBe('Español');
      expect(optionFor(host, 'EN')?.getAttribute('title')).toBe('English');
      expect(host.innerHTML).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
    });
  });

  describe('persistence', () => {
    it('records the choice on click without blocking navigation', async () => {
      const { host, locale } = await render();
      optionFor(host, 'EN')?.click();
      expect(locale.persisted).toEqual(['en']);
    });

    it('still has a working href if scripting never runs', async () => {
      const { host, locale } = await render();
      expect(locale.persisted).toEqual([]);
      expect(optionFor(host, 'EN')?.getAttribute('href')).toBe('/en/contacto');
    });
  });

  describe('presentation', () => {
    it('is light toned by default', async () => {
      const { host } = await render();
      // fixture.nativeElement IS the host element here, not a wrapper.
      expect(host.getAttribute('data-tone')).toBe('light');
    });

    it('supports the dark tone for dark sections', async () => {
      const { host } = await render({ tone: 'dark' });
      expect(host.getAttribute('data-tone')).toBe('dark');
    });

    it('stretches for the mobile drawer', async () => {
      const { host } = await render({ full: true });
      expect(host.classList.contains('is-full')).toBe(true);
    });
  });
});
