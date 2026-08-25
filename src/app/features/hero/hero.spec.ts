import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Hero } from './hero';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [Hero] });
  const fixture = TestBed.createComponent(Hero);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Hero', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is the scroll-spy anchor for the top of the page', async () => {
    const host = await render();
    expect(host.querySelector('section')?.id).toBe('top');
  });

  describe('headline', () => {
    it('renders exactly one h1 for the page', async () => {
      const host = await render();
      expect(host.querySelectorAll('h1')).toHaveLength(1);
    });

    it('splits the headline into two lines without a break inside a translated string', async () => {
      // A break that falls well in Spanish falls wrong in English, so the
      // layout owns it rather than the copy.
      const host = await render();
      const lines = host.querySelectorAll('.hero__title-line');
      expect(lines).toHaveLength(2);
      expect(host.querySelector('h1 br')).toBeNull();
    });
  });

  it('keeps the badge in sentence case, uppercasing in CSS', async () => {
    const host = await render();
    const badge = host.querySelector('.hero__badge')?.textContent?.trim() ?? '';
    expect(badge.length).toBeGreaterThan(0);
    expect(badge).not.toBe(badge.toUpperCase());
  });

  it('hides the decorative ridge from assistive tech', async () => {
    const host = await render();
    const ridge = host.querySelector('.hero__ridge');
    expect(ridge?.getAttribute('aria-hidden')).toBe('true');
    expect(ridge?.getAttribute('focusable')).toBe('false');
  });

  describe('calls to action', () => {
    it('anchors the primary CTA at the contact section', async () => {
      const host = await render();
      const hrefs = Array.from(host.querySelectorAll('.hero__actions a')).map((a) =>
        a.getAttribute('href'),
      );
      expect(hrefs).toContain('#contacto');
    });

    it('takes the WhatsApp number from config rather than hardcoding it', async () => {
      const host = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const hrefs = Array.from(host.querySelectorAll('.hero__actions a')).map((a) =>
        a.getAttribute('href'),
      );
      expect(hrefs).toContain(config.whatsappUrl);
    });
  });

  describe('scroll chevron', () => {
    it('points at the first content section', async () => {
      const host = await render();
      expect(host.querySelector('.hero__scroll')?.getAttribute('href')).toBe('#servicios');
    });

    it('is labelled, being icon-only', async () => {
      // The design gives it no accessible name at all.
      const host = await render();
      expect(host.querySelector('.hero__scroll')?.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
