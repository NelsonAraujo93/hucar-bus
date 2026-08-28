import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ConsentUi } from '../../core/consent/consent-ui';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Footer } from './footer';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([])] });
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

  it('links every legal page, now that all three exist', async () => {
    // Phase 3 omitted these because the design had them as dead # links. The
    // routes are real now, and an EU site has to reach them from every page.
    const host = await render();
    const hrefs = Array.from(host.querySelectorAll('.footer__legal-link')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toContain('/privacidad');
    expect(hrefs).toContain('/terminos');
    expect(hrefs).toContain('/aviso-legal');
  });

  it('offers a way back to the cookie decision', async () => {
    // Withdrawing consent has to be as reachable as giving it, and this is the
    // only route back to that dialog once the banner has been dismissed.
    const host = await render();
    const button = host.querySelector<HTMLButtonElement>('.footer__legal-button');
    expect(button).toBeTruthy();

    const ui = TestBed.inject(ConsentUi);
    expect(ui.isOpen()).toBe(false);
    button?.click();
    expect(ui.isOpen()).toBe(true);
  });

  it('qualifies the section anchors so they work from a legal page', async () => {
    // A bare href="#servicios" resolves to /es/privacidad#servicios and
    // scrolls to nothing.
    const host = await render();
    for (const link of Array.from(host.querySelectorAll('.footer__link[href*="#"]'))) {
      expect(link.getAttribute('href')).not.toMatch(/^#/);
    }
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
