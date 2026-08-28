import { PLATFORM_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConsentService } from '../../core/consent/consent.service';
import { ConsentUi } from '../../core/consent/consent-ui';
import { ConsentBanner } from './consent-banner';

/**
 * jsdom implements <dialog> but not showModal/close, so the element throws the
 * moment the component opens it.
 *
 * Polyfilled here rather than guarded in the component. The production path
 * relies on the browser's own modal behaviour -- the focus trap, Escape, the
 * top layer, inertness -- and a fallback that quietly drops all four would be
 * an accessibility regression introduced purely to satisfy a test environment.
 * What these tests exercise is the component's own logic: draft state, what
 * saving commits, and that the open signal tracks the element.
 */
function polyfillDialog(): void {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  if (typeof proto['showModal'] === 'function') {
    return;
  }
  proto['showModal'] = function showModal(this: HTMLDialogElement): void {
    this.open = true;
  };
  proto['close'] = function close(this: HTMLDialogElement): void {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

interface Harness {
  readonly fixture: ComponentFixture<ConsentBanner>;
  readonly host: HTMLElement;
  readonly consent: ConsentService;
  readonly ui: ConsentUi;
  settle(): Promise<void>;
}

async function render(providers: unknown[] = []): Promise<Harness> {
  TestBed.configureTestingModule({
    imports: [ConsentBanner],
    providers: [provideRouter([]), ...(providers as never[])],
  });
  const fixture = TestBed.createComponent(ConsentBanner);
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    consent: TestBed.inject(ConsentService),
    ui: TestBed.inject(ConsentUi),
    settle: async () => {
      await fixture.whenStable();
    },
  };
}

function banner(host: HTMLElement): HTMLElement | null {
  return host.querySelector('.consent');
}

function action(host: HTMLElement, text: RegExp): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
    text.test(button.textContent ?? ''),
  );
}

describe('ConsentBanner', () => {
  beforeEach(() => {
    polyfillDialog();
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('when it shows', () => {
    it('appears for a visitor who has not decided', async () => {
      const { host } = await render();
      expect(banner(host)).toBeTruthy();
    });

    it('stays away once a decision exists, including a rejection', async () => {
      const { host, consent, settle } = await render();
      consent.rejectAll();
      await settle();
      expect(banner(host)).toBeNull();
    });

    it('renders nothing at all during prerendering', async () => {
      // The static HTML is served to every visitor alike and cannot know what
      // any one browser has stored, so the banner is a client-side concern.
      const { host } = await render([{ provide: PLATFORM_ID, useValue: 'server' }]);
      expect(banner(host)).toBeNull();
    });

    it('is a labelled region rather than a modal dialog', async () => {
      // A focus trap here would stop a keyboard or screen-reader user reaching
      // the privacy policy the banner itself links to.
      const { host } = await render();
      const region = banner(host);
      expect(region?.getAttribute('role')).toBe('region');
      expect(region?.getAttribute('aria-modal')).toBeNull();
      expect(region?.getAttribute('aria-labelledby')).toBe('consent-title');
    });

    it('links to the privacy policy', async () => {
      const { host } = await render();
      expect(host.querySelector('.consent__link')?.getAttribute('href')).toBe('/privacidad');
    });
  });

  describe('reject is as easy as accept', () => {
    it('gives both the same variant, size and click count', async () => {
      // A prominent Aceptar beside a muted Rechazar is a documented AEPD
      // infringement, not a style choice.
      const { host } = await render();
      const accept = action(host, /Aceptar todo|Accept all/);
      const reject = action(host, /Rechazar todo|Reject all/);

      expect(accept).toBeTruthy();
      expect(reject).toBeTruthy();
      expect(reject?.getAttribute('data-variant')).toBe(accept?.getAttribute('data-variant'));
      expect(reject?.getAttribute('data-size')).toBe(accept?.getAttribute('data-size'));
      expect(reject?.className).toBe(accept?.className);
      expect(reject?.hasAttribute('disabled')).toBe(false);
    });

    it('records a rejection from one click, without opening anything', async () => {
      const { host, consent, settle } = await render();
      action(host, /Rechazar todo|Reject all/)?.click();
      await settle();
      expect(consent.hasDecided()).toBe(true);
      expect(consent.allows('analytics')).toBe(false);
      expect(consent.allows('monitoring')).toBe(false);
    });

    it('records an acceptance from one click', async () => {
      const { host, consent, settle } = await render();
      action(host, /Aceptar todo|Accept all/)?.click();
      await settle();
      expect(consent.allows('analytics')).toBe(true);
      expect(consent.allows('monitoring')).toBe(true);
    });
  });

  describe('preferences dialog', () => {
    it('opens from the banner', async () => {
      const { host, ui, settle } = await render();
      action(host, /Configurar|Configure/)?.click();
      await settle();
      expect(ui.isOpen()).toBe(true);
    });

    it('opens from anywhere else that asks, which is how the footer link works', async () => {
      const { host, ui, settle } = await render();
      ui.openPreferences();
      await settle();
      expect(host.querySelector('dialog')?.open).toBe(true);
    });

    it('starts every optional toggle unticked for a new visitor', async () => {
      // A pre-ticked box is not consent.
      const { host, ui, settle } = await render();
      ui.openPreferences();
      await settle();
      const toggles = Array.from(host.querySelectorAll<HTMLInputElement>('.prefs__toggle'));
      expect(toggles).toHaveLength(2);
      for (const toggle of toggles) {
        expect(toggle.checked).toBe(false);
      }
    });

    it('shows the necessary category as a state, not as a dead toggle', async () => {
      const { host, ui, settle } = await render();
      ui.openPreferences();
      await settle();
      expect(host.querySelector('.prefs__always')).toBeTruthy();
      // Two toggles, not three: necessary has none to be frustrated by.
      expect(host.querySelectorAll('.prefs__toggle')).toHaveLength(2);
    });

    it('reflects the stored decision when reopened', async () => {
      const { host, consent, ui, settle } = await render();
      consent.save({ analytics: true });
      ui.openPreferences();
      await settle();
      const toggles = Array.from(host.querySelectorAll<HTMLInputElement>('.prefs__toggle'));
      expect(toggles[0].checked).toBe(true);
      expect(toggles[1].checked).toBe(false);
    });

    it('saves a partial selection', async () => {
      const { host, consent, ui, settle } = await render();
      ui.openPreferences();
      await settle();

      const analytics = host.querySelector<HTMLInputElement>('#consent-analytics');
      expect(analytics).toBeTruthy();
      analytics!.checked = true;
      analytics!.dispatchEvent(new Event('change'));
      await settle();

      action(host, /Guardar preferencias|Save preferences/)?.click();
      await settle();

      expect(consent.allows('analytics')).toBe(true);
      expect(consent.allows('monitoring')).toBe(false);
    });

    it('changes nothing when closed without saving', async () => {
      const { host, consent, ui, settle } = await render();
      ui.openPreferences();
      await settle();

      const analytics = host.querySelector<HTMLInputElement>('#consent-analytics');
      analytics!.checked = true;
      analytics!.dispatchEvent(new Event('change'));
      await settle();

      host.querySelector<HTMLButtonElement>('.prefs__close')?.click();
      await settle();

      expect(consent.hasDecided()).toBe(false);
      expect(consent.allows('analytics')).toBe(false);
    });

    it('keeps the signal in step when the dialog closes itself', async () => {
      // Escape and the backdrop both fire close without going through our
      // button, so the element is the source of truth for that transition.
      const { host, ui, settle } = await render();
      ui.openPreferences();
      await settle();

      const dialog = host.querySelector('dialog');
      dialog?.dispatchEvent(new Event('close'));
      await settle();
      expect(ui.isOpen()).toBe(false);
    });

    it('describes each toggle for screen readers', async () => {
      const { host, ui, settle } = await render();
      ui.openPreferences();
      await settle();
      for (const toggle of Array.from(host.querySelectorAll<HTMLInputElement>('.prefs__toggle'))) {
        const describedBy = toggle.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(host.querySelector(`#${describedBy}`)?.textContent?.trim()).toBeTruthy();
      }
    });

    it('names the dialog', async () => {
      const { host } = await render();
      const dialog = host.querySelector('dialog');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('consent-prefs-title');
      expect(host.querySelector('#consent-prefs-title')?.textContent?.trim()).toBeTruthy();
    });
  });
});
