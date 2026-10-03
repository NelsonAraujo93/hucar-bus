import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SITE_CONFIG } from '../../../core/config/site.config';
import { PrivacyNotice } from './privacy-notice';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [PrivacyNotice], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(PrivacyNotice);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('PrivacyNotice', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('gives every item of the AEPD first layer', async () => {
    const host = await render();
    const labels = Array.from(host.querySelectorAll('dt')).map((dt) => dt.textContent?.trim());
    expect(labels).toEqual([
      'Responsable',
      'Finalidad',
      'Legitimación',
      'Destinatarios',
      'Conservación',
      'Derechos',
    ]);
  });

  it('names the controller and the rights address from config', async () => {
    const host = await render();
    const config = TestBed.inject(SITE_CONFIG);
    expect(host.textContent).toContain(config.legalName);
    expect(host.querySelector('a[href^="mailto:"]')?.getAttribute('href')).toBe(
      `mailto:${config.email}`,
    );
  });

  it('states the one-year retention and that there is no advertising', async () => {
    const host = await render();
    expect(host.textContent).toContain('Un año');
    expect(host.textContent).toContain('No la usamos para enviarte publicidad');
  });

  it('links to the full privacy policy', async () => {
    const host = await render();
    expect(host.querySelector('a[href="/privacidad"]')).toBeTruthy();
  });
});
