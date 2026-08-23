import { localizedPath } from './localized-path';

describe('localizedPath', () => {
  it('swaps the locale on a bare locale root', () => {
    expect(localizedPath('/es/', 'en')).toBe('/en/');
    expect(localizedPath('/en/', 'es')).toBe('/es/');
  });

  it('swaps the locale without a trailing slash', () => {
    expect(localizedPath('/es', 'en')).toBe('/en/');
  });

  it('preserves the rest of the path', () => {
    expect(localizedPath('/es/servicios/traslados', 'en')).toBe('/en/servicios/traslados');
  });

  it('prepends the locale when the path carries none', () => {
    expect(localizedPath('/about', 'es')).toBe('/es/about');
  });

  it('handles the bare root', () => {
    expect(localizedPath('/', 'en')).toBe('/en/');
    expect(localizedPath('', 'es')).toBe('/es/');
  });

  it('is idempotent when the target already matches', () => {
    expect(localizedPath('/es/contacto', 'es')).toBe('/es/contacto');
  });

  it('does not mistake a path segment that merely starts with a locale name', () => {
    expect(localizedPath('/estacion/norte', 'en')).toBe('/en/estacion/norte');
  });

  it('collapses repeated slashes', () => {
    expect(localizedPath('//es//contacto//', 'en')).toBe('/en/contacto');
  });
});
