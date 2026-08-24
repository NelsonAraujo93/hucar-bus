import { TestBed } from '@angular/core/testing';
import { Services } from './services';
import { services } from './services.data';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({ imports: [Services] });
  const fixture = TestBed.createComponent(Services);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Services', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is the anchor target for the services link', async () => {
    const host = await render();
    expect(host.querySelector('section')?.id).toBe('servicios');
  });

  it('renders a card per service', async () => {
    const host = await render();
    expect(host.querySelectorAll('.service-card')).toHaveLength(services().length);
  });

  it('gives each card a heading below the section heading', async () => {
    const host = await render();
    expect(host.querySelectorAll('h2')).toHaveLength(1);
    expect(host.querySelectorAll('h3')).toHaveLength(services().length);
  });

  describe('the card as a control', () => {
    it('uses a real link, not a div with a pointer cursor', async () => {
      // The prototype makes the whole card hoverable but links nowhere, which
      // would be invisible to keyboard and screen-reader users.
      const host = await render();
      const links = host.querySelectorAll('a.service-card__link');
      expect(links).toHaveLength(services().length);
      for (const link of Array.from(links)) {
        expect(link.getAttribute('href')).toBe('#contacto');
      }
    });

    it('names each link with its service, not just "Consultar"', async () => {
      // Six identically-named links are useless in a screen reader's link list.
      const host = await render();
      const names = Array.from(host.querySelectorAll('a.service-card__link')).map((a) =>
        (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );
      const titles = services().map((s) => s.title);
      for (const title of titles) {
        expect(names.some((n) => n.includes(title))).toBe(true);
      }
      expect(new Set(names).size).toBe(names.length);
    });

    it('keeps the decorative arrow out of the accessibility tree', async () => {
      const host = await render();
      for (const arrow of Array.from(host.querySelectorAll('.service-card__arrow'))) {
        expect(arrow.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('hides the icon from assistive tech, the heading already names the card', async () => {
      const host = await render();
      for (const icon of Array.from(host.querySelectorAll('.service-card__icon'))) {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });
});
