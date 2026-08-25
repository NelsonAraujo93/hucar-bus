import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG, type SiteConfig } from './site.config';

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
    expect(config.address).toBeTruthy();
  });

  it('keeps the tel: href free of formatting so it dials correctly', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.phoneHref.startsWith('tel:')).toBe(true);
    expect(config.phoneHref).not.toContain(' ');
  });

  it('points WhatsApp and Instagram at real destinations', () => {
    const config = TestBed.inject(SITE_CONFIG);
    expect(config.whatsappUrl.startsWith('https://wa.me/')).toBe(true);
    expect(config.instagramUrl.startsWith('https://instagram.com/')).toBe(true);
  });

  it('can be overridden, which is how the placeholders get replaced', () => {
    // Configure before injecting: injecting first instantiates the module.
    const real: SiteConfig = {
      phone: '+34 928 000 000',
      phoneHref: 'tel:+34928000000',
      email: 'hola@hucarbus.com',
      whatsappUrl: 'https://wa.me/34928000000',
      instagramUrl: 'https://instagram.com/hucarbus',
      address: 'Arrecife, Lanzarote, 35500',
      addressShort: 'Arrecife, Lanzarote',
      foundedYear: 2014,
      yearsOfExperience: '10+',
      availability: '24/7',
      rating: '4.8★',
    };
    TestBed.configureTestingModule({
      providers: [{ provide: SITE_CONFIG, useValue: real }],
    });
    expect(TestBed.inject(SITE_CONFIG).phone).toBe('+34 928 000 000');
  });
});
