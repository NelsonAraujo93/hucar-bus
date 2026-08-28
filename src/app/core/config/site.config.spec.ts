import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG, type SiteConfig } from './site.config';
import { siteConfigWith } from './site.config.fixture';

function configFor(locale: string): SiteConfig {
  TestBed.configureTestingModule({
    providers: [{ provide: LOCALE_ID, useValue: locale }],
  });
  return TestBed.inject(SITE_CONFIG);
}

describe('SITE_CONFIG', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('provides every client-supplied value from one place', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.phone).toBeTruthy();
    expect(config.email).toBeTruthy();
    expect(config.whatsappUrl).toBeTruthy();
    expect(config.instagramUrl).toBeTruthy();
    expect(config.addressFull).toBeTruthy();
  });

  it('carries the legal identity the aviso legal needs', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.legalName).toBe('HUCAR BUS LANZAROTE TURISMO, S.L.');
    expect(config.nif).toBe('B26944884');
    expect(config.address.street).toBe('Calle Veracruz, 27');
    expect(config.address.postcode).toBe('35500');
    expect(config.address.city).toBe('Arrecife');
  });

  it('leaves the registry fields null rather than blank, so a gap is visible', () => {
    // LSSI-CE art. 10 wants both. Neither has been supplied, and an empty string
    // renders as nothing at all -- which reads as a page that simply omits them.
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.mercantileRegistry).toBeNull();
    expect(config.transportAuthorisation).toBeNull();
  });

  it('ships none of the placeholder contact details that were live', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.phone).not.toContain('600 000 000');
    expect(config.phoneHref).not.toContain('600000000');
    expect(config.whatsappUrl).not.toContain('600000000');
    expect(config.email).not.toBe('info@hucarbus.com');
  });

  it('publishes an email address that actually receives', () => {
    // info@hucarbus.com was the placeholder and no such mailbox is being
    // created, so publishing it would publish an address that bounces.
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.email).toBe('hucarbus@gmail.com');
  });

  describe('one phone number per language', () => {
    it('serves the Spanish number to the Spanish build', () => {
      const config = configFor('es');
      expect(config.phone).toBe('+34 677 87 18 61');
      expect(config.phoneHref).toBe('tel:+34677871861');
      expect(config.whatsappUrl).toBe('https://wa.me/34677871861');
    });

    it('serves the English number to the English build', () => {
      const config = configFor('en-GB');
      expect(config.phone).toBe('+34 677 87 35 89');
      expect(config.phoneHref).toBe('tel:+34677873589');
      expect(config.whatsappUrl).toBe('https://wa.me/34677873589');
    });

    it('falls back rather than throwing on a locale it was not built for', () => {
      // LOCALE_ID is fixed per build so this should not happen in production,
      // but an unresolvable tag must not take the whole config down with it.
      const config = configFor('de-DE');
      expect(config.phone).toBeTruthy();
    });
  });

  it('keeps the tel: href free of formatting so it dials correctly', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.phoneHref.startsWith('tel:')).toBe(true);
    expect(config.phoneHref).not.toContain(' ');
  });

  it('strips the leading + from the WhatsApp link, which wa.me rejects', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.whatsappUrl.startsWith('https://wa.me/')).toBe(true);
    expect(config.whatsappUrl).not.toContain('+');
    expect(config.instagramUrl.startsWith('https://instagram.com/')).toBe(true);
  });

  it('formats the one-line address from the structured parts', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.addressFull).toContain(config.address.street);
    expect(config.addressFull).toContain(config.address.postcode);
    expect(config.addressFull).toContain(config.address.city);
  });

  it('can be overridden, which is how the remaining placeholders get replaced', () => {
    // Configure before injecting: injecting first instantiates the module.
    TestBed.configureTestingModule({
      providers: [{ provide: SITE_CONFIG, useValue: siteConfigWith({ phone: '+34 928 000 000' }) }],
    });
    expect(TestBed.inject(SITE_CONFIG).phone).toBe('+34 928 000 000');
  });
});
