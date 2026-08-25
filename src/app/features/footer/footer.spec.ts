import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Footer } from './footer';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [Footer] });
  const fixture = TestBed.createComponent(Footer);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Footer', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('ships no dead links', async () => {
    const host = await render();
    const dead = Array.from(host.querySelectorAll('a')).filter(
      (a) => a.getAttribute('href') === '#' || a.getAttribute('href') === '',
    );
    expect(dead).toEqual([]);
  });

  it('omits the legal links until the pages exist', async () => {
    // The design has Política de Privacidad and Términos as dead # links. An EU
    // site needs both for real; a link to nowhere is worse than no link.
    const host = await render();
    const text = host.textContent ?? '';
    expect(text).not.toContain('Privacidad');
    expect(text).not.toContain('Términos');
  });

  it('links social icons at real destinations', async () => {
    const host = await render();
    const config = TestBed.inject(SITE_CONFIG);
    const hrefs = Array.from(host.querySelectorAll('.footer__social-link')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toContain(config.instagramUrl);
    expect(hrefs).toContain(config.whatsappUrl);
  });

  it('drops Facebook, for which no page was ever supplied', async () => {
    const host = await render();
    expect(host.innerHTML).not.toContain('facebook');
  });

  it('names each icon-only social link', async () => {
    const host = await render();
    for (const link of Array.from(host.querySelectorAll('.footer__social-link'))) {
      expect(link.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('renders contact details from the config, not hardcoded', async () => {
    const host = await render();
    const config = TestBed.inject(SITE_CONFIG);
    const text = host.textContent ?? '';
    expect(text).toContain(config.phone);
    expect(text).toContain(config.email);
    expect(text).toContain(config.addressShort);
  });

  it('makes the phone dialable and the email clickable', async () => {
    const host = await render();
    const config = TestBed.inject(SITE_CONFIG);
    const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(config.phoneHref);
    expect(hrefs).toContain(`mailto:${config.email}`);
  });

  it('shows the current year rather than a stale literal', async () => {
    const host = await render();
    expect(host.textContent).toContain(String(new Date().getFullYear()));
  });
});
