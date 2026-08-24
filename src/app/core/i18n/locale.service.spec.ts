import { LOCALE_ID, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocaleService } from './locale.service';

interface FakeLocation {
  pathname: string;
  search: string;
  hash: string;
  assign(url: string): void;
}

function makeDocument(location: FakeLocation | null): {
  document: Document;
  cookiesWritten: string[];
} {
  const cookiesWritten: string[] = [];
  const fake = {
    set cookie(value: string) {
      cookiesWritten.push(value);
    },
    get cookie(): string {
      return cookiesWritten.join('; ');
    },
    defaultView: location === null ? null : { location },
  };
  return { document: fake as unknown as Document, cookiesWritten };
}

function makeLocation(
  pathname: string,
  search = '',
  hash = '',
): FakeLocation & { assigned: string[] } {
  const assigned: string[] = [];
  return {
    pathname,
    search,
    hash,
    assigned,
    assign(url: string): void {
      assigned.push(url);
    },
  };
}

function configure(options: {
  localeId: string;
  platformId: string;
  location: FakeLocation | null;
}): { service: LocaleService; cookiesWritten: string[] } {
  const { document, cookiesWritten } = makeDocument(options.location);
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: options.localeId },
      { provide: PLATFORM_ID, useValue: options.platformId },
      { provide: DOCUMENT, useValue: document },
    ],
  });
  return { service: TestBed.inject(LocaleService), cookiesWritten };
}

describe('LocaleService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('currentLocale', () => {
    it('derives the locale from LOCALE_ID', () => {
      const { service } = configure({
        localeId: 'es-ES',
        platformId: 'browser',
        location: makeLocation('/es/'),
      });
      expect(service.currentLocale()).toBe('es');
    });

    it('derives en from en-GB', () => {
      const { service } = configure({
        localeId: 'en-GB',
        platformId: 'browser',
        location: makeLocation('/en/'),
      });
      expect(service.currentLocale()).toBe('en');
    });

    it('falls back when LOCALE_ID is not a supported locale', () => {
      const { service } = configure({
        localeId: 'de-DE',
        platformId: 'browser',
        location: makeLocation('/'),
      });
      expect(service.currentLocale()).toBe('en');
    });
  });

  describe('alternateLocales', () => {
    it('excludes the active locale', () => {
      const { service } = configure({
        localeId: 'es-ES',
        platformId: 'browser',
        location: makeLocation('/es/'),
      });
      expect(service.alternateLocales()).toEqual(['en']);
    });
  });

  describe('pathFor', () => {
    it('rewrites the current path into the target locale', () => {
      const { service } = configure({
        localeId: 'es-ES',
        platformId: 'browser',
        location: makeLocation('/es/contacto', '?ref=email', '#form'),
      });
      expect(service.pathFor('en')).toBe('/en/contacto?ref=email#form');
    });

    it('falls back to the locale root when there is no window', () => {
      // This is the prerendering path: a document with no browsing context.
      const { service } = configure({
        localeId: 'es-ES',
        platformId: 'server',
        location: null,
      });
      expect(service.pathFor('en')).toBe('/en/');
    });
  });

  describe('persist', () => {
    it('writes the cookie without navigating', () => {
      const location = makeLocation('/es/');
      const { service, cookiesWritten } = configure({
        localeId: 'es-ES',
        platformId: 'browser',
        location,
      });

      service.persist('en');

      expect(cookiesWritten).toHaveLength(1);
      expect(cookiesWritten[0]).toContain('hb_locale=en');
      // The anchor's href performs the navigation, not this.
      expect(location.assigned).toEqual([]);
    });
  });

  describe('switchTo', () => {
    it('writes the cookie and navigates to the equivalent path', () => {
      const location = makeLocation('/es/servicios');
      const { service, cookiesWritten } = configure({
        localeId: 'es-ES',
        platformId: 'browser',
        location,
      });

      service.switchTo('en');

      expect(cookiesWritten).toHaveLength(1);
      expect(cookiesWritten[0]).toContain('hb_locale=en');
      expect(cookiesWritten[0]).toContain('path=/');
      expect(cookiesWritten[0]).toContain('max-age=31536000');
      expect(cookiesWritten[0]).toContain('SameSite=Lax');
      expect(location.assigned).toEqual(['/en/servicios']);
    });

    it('preserves the query string and fragment', () => {
      const location = makeLocation('/es/contacto', '?ref=email', '#form');
      const { service } = configure({ localeId: 'es-ES', platformId: 'browser', location });

      service.switchTo('en');

      expect(location.assigned).toEqual(['/en/contacto?ref=email#form']);
    });

    it('does nothing on the server, where there is no cookie jar to write to', () => {
      const location = makeLocation('/es/');
      const { service, cookiesWritten } = configure({
        localeId: 'es-ES',
        platformId: 'server',
        location,
      });

      service.switchTo('en');

      expect(cookiesWritten).toEqual([]);
      expect(location.assigned).toEqual([]);
    });

    it('writes the cookie but does not navigate when there is no window', () => {
      const { service, cookiesWritten } = configure({
        localeId: 'es-ES',
        platformId: 'browser',
        location: null,
      });

      expect(() => {
        service.switchTo('en');
      }).not.toThrow();
      expect(cookiesWritten).toHaveLength(1);
    });
  });
});
