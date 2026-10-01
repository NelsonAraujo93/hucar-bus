import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTACT_GATEWAY } from '../../application/contact/contact-gateway';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Contact } from './contact';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [Contact],
    providers: [provideRouter([]), { provide: CONTACT_GATEWAY, useValue: { send: vi.fn() } }],
  });
  const fixture = TestBed.createComponent(Contact);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Contact', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is the anchor target every CTA on the page points at', async () => {
    const host = await render();
    expect(host.querySelector('section')?.id).toBe('contacto');
  });

  it('hosts the form', async () => {
    const host = await render();
    expect(host.querySelector('hb-contact-form form')).toBeTruthy();
  });

  describe('contact details', () => {
    it('comes from config rather than the template', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const text = host.textContent ?? '';
      expect(text).toContain(config.phone);
      expect(text).toContain(config.email);
      expect(text).toContain(config.addressFull);
    });

    it('makes the phone, email and WhatsApp actionable', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain(config.phoneHref);
      expect(hrefs).toContain(`mailto:${config.email}`);
      expect(hrefs).toContain(config.whatsappUrl);
    });
  });
});
