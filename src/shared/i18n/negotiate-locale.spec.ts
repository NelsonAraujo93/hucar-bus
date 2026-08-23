import { FALLBACK_LOCALE, negotiateLocale } from './negotiate-locale';

describe('negotiateLocale', () => {
  describe('fallback', () => {
    it('falls back when no signal is available at all', () => {
      expect(negotiateLocale(null, null)).toBe('en');
    });

    it('falls back on an empty header', () => {
      expect(negotiateLocale('', null)).toBe('en');
    });

    it('falls back for an unsupported language', () => {
      expect(negotiateLocale('de-DE,de;q=0.9', null)).toBe('en');
    });

    it('exposes the fallback it uses', () => {
      expect(FALLBACK_LOCALE).toBe('en');
    });
  });

  describe('Accept-Language', () => {
    it('matches a regional tag by its primary subtag', () => {
      expect(negotiateLocale('en-GB,en;q=0.9', null)).toBe('en');
    });

    it('picks Spanish when Spanish is preferred', () => {
      expect(negotiateLocale('es-ES,es;q=0.9,en;q=0.8', null)).toBe('es');
    });

    it('honours q-values over header order', () => {
      // English is listed first but Spanish outranks it.
      expect(negotiateLocale('en;q=0.3,es;q=0.9', null)).toBe('es');
    });

    it('keeps header order when q-values tie', () => {
      expect(negotiateLocale('es,en', null)).toBe('es');
      expect(negotiateLocale('en,es', null)).toBe('en');
    });

    it('treats an absent q-value as 1', () => {
      // Spanish has no q and so outranks an explicitly weighted English.
      expect(negotiateLocale('en;q=0.9,es', null)).toBe('es');
    });

    it('ignores a tag explicitly refused with q=0', () => {
      expect(negotiateLocale('es;q=0,en;q=0.1', null)).toBe('en');
    });

    it('ignores a tag whose q-value is malformed', () => {
      expect(negotiateLocale('es;q=notanumber,en;q=0.1', null)).toBe('en');
    });

    it('ignores the wildcard rather than matching it', () => {
      expect(negotiateLocale('*', null)).toBe('en');
    });

    it('tolerates whitespace and mixed case', () => {
      expect(negotiateLocale('  ES-es ;  Q=0.9 , en;q=0.1', null)).toBe('es');
    });

    it('falls back when every tag is refused', () => {
      expect(negotiateLocale('es;q=0,en;q=0', null)).toBe('en');
    });
  });

  describe('cookie precedence', () => {
    it('lets a valid cookie override the header', () => {
      expect(negotiateLocale('en-GB,en;q=0.9', 'es')).toBe('es');
      expect(negotiateLocale('es-ES,es;q=0.9', 'en')).toBe('en');
    });

    it('accepts a regional cookie value', () => {
      expect(negotiateLocale('en-GB', 'es-ES')).toBe('es');
    });

    it('ignores an invalid cookie and defers to the header', () => {
      expect(negotiateLocale('es-ES,es;q=0.9', 'de')).toBe('es');
    });

    it('ignores an invalid cookie and falls back when the header is unusable', () => {
      expect(negotiateLocale(null, 'klingon')).toBe('en');
    });

    it('ignores an empty cookie', () => {
      expect(negotiateLocale('es-ES', '')).toBe('es');
    });
  });
});
