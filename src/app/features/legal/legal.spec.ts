import { signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { siteConfigWith } from '../../core/config/site.config.fixture';
import { ConsentUi } from '../../core/consent/consent-ui';
import { CONSENT_STORAGE_KEY } from '../../core/consent/consent.model';
import { LOCALE_COOKIE } from '../../../shared/i18n/negotiate-locale';
import { ScrollSpy } from '../../core/navigation/scroll-spy';
import { legalRoutes } from './legal.routes';
import { LegalNotice } from './legal-notice';
import { Privacy } from './privacy';
import { Terms } from './terms';

/** The navbar reads the spy; a legal page has no spied sections to feed it. */
class ScrollSpyStub {
  readonly activeId = signal<string>('top');
  readonly scrolled = signal(false);
  start(): void {
    /* nothing to observe here */
  }
}

async function render<T>(component: Type<T>, providers: unknown[] = []): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      { provide: ScrollSpy, useValue: new ScrollSpyStub() },
      ...(providers as never[]),
    ],
  });
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const PAGES: readonly { name: string; component: Type<unknown> }[] = [
  { name: 'Privacy', component: Privacy },
  { name: 'Terms', component: Terms },
  { name: 'LegalNotice', component: LegalNotice },
];

describe('legal pages', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('routes', () => {
    it('serves all three documents an EU commercial site needs', () => {
      expect(legalRoutes.map((route) => route.path)).toEqual([
        'privacidad',
        'terminos',
        'aviso-legal',
      ]);
    });

    it('keeps the paths Spanish in both locales', () => {
      // Translating them would break every link already shared or given out,
      // and hreflang already tells crawlers the two are the same document.
      for (const route of legalRoutes) {
        expect(route.path).not.toMatch(/privacy|terms|legal-notice/);
      }
    });

    it('loads each document lazily', () => {
      for (const route of legalRoutes) {
        expect(route.loadComponent).toBeTypeOf('function');
        expect(route.component).toBeUndefined();
      }
    });
  });

  for (const { name, component } of PAGES) {
    describe(name, () => {
      it('says plainly that it is not finished', async () => {
        // These carry real identity data beside marked gaps, and a visitor is
        // entitled to know which is which before relying on any of it.
        const host = await render(component);
        expect(host.querySelector('.legal__draft')).toBeTruthy();
      });

      it('heads the document with exactly one h1', async () => {
        const host = await render(component);
        expect(host.querySelectorAll('h1')).toHaveLength(1);
      });

      it('names the business with its registered name, not the trading one', async () => {
        const host = await render(component);
        const config = TestBed.inject(SITE_CONFIG);
        expect(host.textContent).toContain(config.legalName);
      });

      it('ships no dead links', async () => {
        const host = await render(component);
        const dead = Array.from(host.querySelectorAll('a')).filter(
          (a) => a.getAttribute('href') === '#' || a.getAttribute('href') === '',
        );
        expect(dead).toEqual([]);
      });
    });
  }

  describe('LegalNotice', () => {
    it('publishes the identity block LSSI-CE art. 10 requires', async () => {
      const host = await render(LegalNotice);
      const config = TestBed.inject(SITE_CONFIG);
      const text = host.textContent ?? '';
      expect(text).toContain(config.legalName);
      expect(text).toContain(config.nif);
      expect(text).toContain(config.addressFull);
      expect(text).toContain(config.email);
    });

    it('shows the missing registry fields as gaps rather than omitting them', async () => {
      // Silently leaving them out reads as a page that does not need them.
      const host = await render(LegalNotice);
      expect(host.querySelectorAll('hb-legal-pending').length).toBeGreaterThanOrEqual(3);
    });

    it('prints the registry data instead, once it is supplied', async () => {
      const host = await render(LegalNotice, [
        {
          provide: SITE_CONFIG,
          useValue: siteConfigWith({
            mercantileRegistry: 'Tomo 1, Folio 2, Hoja GC-3, Inscripción 1',
            transportAuthorisation: 'VD-1234567',
          }),
        },
      ]);
      const text = host.textContent ?? '';
      expect(text).toContain('Tomo 1, Folio 2, Hoja GC-3');
      expect(text).toContain('VD-1234567');
    });
  });

  describe('Privacy', () => {
    it('describes the storage the code actually sets, by name', async () => {
      // The cookie policy has to match what the banner really writes, so both
      // names come from the modules that write them. A rename cannot leave this
      // page describing something that no longer exists.
      const host = await render(Privacy);
      const text = host.textContent ?? '';
      expect(text).toContain(LOCALE_COOKIE);
      expect(text).toContain(CONSENT_STORAGE_KEY);
    });

    it('lists exactly the two things stored today, and no invented third', async () => {
      const host = await render(Privacy);
      expect(host.querySelectorAll('.doc__table tbody tr')).toHaveLength(2);
    });

    it('reopens the cookie decision from the policy itself', async () => {
      const host = await render(Privacy);
      const ui = TestBed.inject(ConsentUi);
      expect(ui.isOpen()).toBe(false);
      host.querySelector<HTMLButtonElement>('.doc__cookie-button')?.click();
      expect(ui.isOpen()).toBe(true);
    });

    it('points complaints at the real supervisory authority', async () => {
      const host = await render(Privacy);
      const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('https://www.aepd.es');
    });

    it('gives an address for exercising rights', async () => {
      const host = await render(Privacy);
      const config = TestBed.inject(SITE_CONFIG);
      const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain(`mailto:${config.email}`);
    });
  });

  describe('Terms', () => {
    it('claims no conditions it has not been given', async () => {
      // Cancellation windows and liability limits are commercial decisions, not
      // anything derivable from the codebase.
      const host = await render(Terms);
      expect(host.querySelectorAll('hb-legal-pending').length).toBeGreaterThanOrEqual(2);
    });

    it('offers a real way to ask in the meantime', async () => {
      const host = await render(Terms);
      const config = TestBed.inject(SITE_CONFIG);
      const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain(config.phoneHref);
      expect(hrefs).toContain(`mailto:${config.email}`);
    });
  });
});
