import { readLocaleCookie } from './locale-cookie';

describe('readLocaleCookie', () => {
  it('returns null when there is no Cookie header', () => {
    expect(readLocaleCookie(null)).toBeNull();
  });

  it('returns null for an empty header', () => {
    expect(readLocaleCookie('')).toBeNull();
  });

  it('reads the cookie when it is the only one', () => {
    expect(readLocaleCookie('hb_locale=es')).toBe('es');
  });

  it('reads the cookie from among others', () => {
    expect(readLocaleCookie('_ga=GA1.1.123; hb_locale=en; other=x')).toBe('en');
  });

  it('tolerates surrounding whitespace', () => {
    expect(readLocaleCookie('  hb_locale = es-ES  ')).toBe('es-ES');
  });

  it('returns null when the cookie is absent', () => {
    expect(readLocaleCookie('_ga=GA1.1.123; other=x')).toBeNull();
  });

  it('skips malformed pairs that carry no "="', () => {
    expect(readLocaleCookie('brokenpair; hb_locale=es')).toBe('es');
  });

  it('does not match a cookie whose name merely ends with the same text', () => {
    expect(readLocaleCookie('not_hb_locale=es')).toBeNull();
  });

  it('returns the first occurrence when the cookie is duplicated', () => {
    expect(readLocaleCookie('hb_locale=es; hb_locale=en')).toBe('es');
  });

  it('decodes a percent-encoded value', () => {
    expect(readLocaleCookie('hb_locale=es%2DES')).toBe('es-ES');
  });

  it('returns the raw value when the encoding is malformed', () => {
    expect(readLocaleCookie('hb_locale=%E0%A4%A')).toBe('%E0%A4%A');
  });

  it('returns an empty string for a present but empty cookie', () => {
    expect(readLocaleCookie('hb_locale=')).toBe('');
  });
});
