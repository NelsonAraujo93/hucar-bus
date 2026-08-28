import type { SiteConfig } from './site.config';

/**
 * A complete SiteConfig for tests, overridable field by field.
 *
 * Test-only, and imported by nothing in the production graph. It exists because
 * the config grew a legal-identity block: a spec that only cares about the
 * founding year should not have to restate a NIF and a postal address, and every
 * new field would otherwise break every spec that provides the token.
 */
export function siteConfigWith(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    legalName: 'TEST BUS, S.L.',
    tradingName: 'Test Bus',
    nif: 'B00000000',
    address: {
      street: 'Calle Falsa, 1',
      postcode: '35500',
      city: 'Arrecife',
      province: 'Las Palmas',
      country: 'ES',
    },
    addressFull: 'Calle Falsa, 1, 35500 Arrecife, Las Palmas',
    addressShort: 'Arrecife, Lanzarote',
    phone: '+34 600 000 000',
    phoneHref: 'tel:+34600000000',
    whatsappUrl: 'https://wa.me/34600000000',
    email: 'test@example.com',
    instagramUrl: 'https://instagram.com/example',
    foundedYear: 2014,
    yearsOfExperience: '10+',
    availability: '24/7',
    mercantileRegistry: null,
    transportAuthorisation: null,
    ...overrides,
  };
}
