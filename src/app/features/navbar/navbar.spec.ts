import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COMPOSED_NAV_IDS } from '../../core/navigation/nav-items';
import { ScrollSpy } from '../../core/navigation/scroll-spy';
import { Navbar } from './navbar';

class ScrollSpyStub {
  readonly activeId = signal<string>('top');
  readonly scrolled = signal(false);
  start(): void {
    /* the page starts it; the navbar only reads */
  }
}

async function render(): Promise<{ host: HTMLElement; spy: ScrollSpyStub; detect: () => void }> {
  const spy = new ScrollSpyStub();
  TestBed.configureTestingModule({
    imports: [Navbar],
    providers: [{ provide: ScrollSpy, useValue: spy }],
  });
  const fixture = TestBed.createComponent(Navbar);
  await fixture.whenStable();
  return {
    host: fixture.nativeElement as HTMLElement,
    spy,
    detect: () => fixture.detectChanges(),
  };
}

describe('Navbar', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('links', () => {
    it('renders every section link', async () => {
      const { host } = await render();
      for (const id of COMPOSED_NAV_IDS) {
        // Suffix match: the href is qualified with the locale root now, and
        // the locale under test is whatever LOCALE_ID defaults to.
        expect(host.querySelector(`.nav__link[href$="#${id}"]`)).toBeTruthy();
      }
    });

    it('marks the active section with aria-current', async () => {
      const { host, spy, detect } = await render();
      spy.activeId.set('nosotros');
      detect();
      const active = host.querySelector('.nav__link[href$="#nosotros"]');
      expect(active?.getAttribute('aria-current')).toBe('true');
      expect(
        host.querySelector('.nav__link[href$="#servicios"]')?.getAttribute('aria-current'),
      ).toBeNull();
    });

    it('elevates once the page scrolls', async () => {
      const { host, spy, detect } = await render();
      expect(host.querySelector('.nav')?.classList.contains('is-scrolled')).toBe(false);
      spy.scrolled.set(true);
      detect();
      expect(host.querySelector('.nav')?.classList.contains('is-scrolled')).toBe(true);
    });
  });

  describe('drawer', () => {
    it('is closed initially and reports that to assistive tech', async () => {
      const { host } = await render();
      const toggle = host.querySelector('.nav__toggle');
      expect(toggle?.getAttribute('aria-expanded')).toBe('false');
      expect(host.querySelector('.nav__drawer')?.classList.contains('is-open')).toBe(false);
    });

    it('is inert while closed, so its links are not focusable', async () => {
      const { host } = await render();
      expect(host.querySelector('.nav__drawer')?.hasAttribute('inert')).toBe(true);
    });

    it('opens on the toggle and updates aria-expanded', async () => {
      const { host, detect } = await render();
      host.querySelector<HTMLButtonElement>('.nav__toggle')?.click();
      detect();
      expect(host.querySelector('.nav__toggle')?.getAttribute('aria-expanded')).toBe('true');
      expect(host.querySelector('.nav__drawer')?.classList.contains('is-open')).toBe(true);
      expect(host.querySelector('.nav__drawer')?.hasAttribute('inert')).toBe(false);
    });

    it('closes again on a second press', async () => {
      const { host, detect } = await render();
      const toggle = host.querySelector<HTMLButtonElement>('.nav__toggle');
      toggle?.click();
      detect();
      toggle?.click();
      detect();
      expect(host.querySelector('.nav__toggle')?.getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when a link inside it is followed', async () => {
      const { host, detect } = await render();
      host.querySelector<HTMLButtonElement>('.nav__toggle')?.click();
      detect();
      host.querySelector<HTMLAnchorElement>('.nav__drawer-link')?.click();
      detect();
      expect(host.querySelector('.nav__toggle')?.getAttribute('aria-expanded')).toBe('false');
    });

    it('names the toggle, which is icon-only', async () => {
      const { host } = await render();
      expect(host.querySelector('.nav__toggle')?.getAttribute('aria-label')).toBeTruthy();
    });

    it('points the toggle at the drawer it controls', async () => {
      const { host } = await render();
      const controls = host.querySelector('.nav__toggle')?.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(host.querySelector(`#${controls}`)).toBeTruthy();
    });
  });
});
