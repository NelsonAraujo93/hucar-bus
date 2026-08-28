import { TestBed } from '@angular/core/testing';
import { SITE_CONFIG } from '../../core/config/site.config';
import { Contact, type ContactStatus } from './contact';

async function render(status?: ContactStatus): Promise<{ host: HTMLElement; component: Contact }> {
  TestBed.configureTestingModule({ imports: [Contact] });
  const fixture = TestBed.createComponent(Contact);
  if (status !== undefined) {
    fixture.componentInstance.status.set(status);
  }
  await fixture.whenStable();
  return { host: fixture.nativeElement as HTMLElement, component: fixture.componentInstance };
}

describe('Contact', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is the anchor target every CTA on the page points at', async () => {
    const { host } = await render();
    expect(host.querySelector('section')?.id).toBe('contacto');
  });

  describe('form', () => {
    it('pairs every input with a label', async () => {
      // Placeholder-only fields are unusable with a screen reader.
      const { host } = await render();
      const controls = Array.from(host.querySelectorAll<HTMLElement>('.field__input'));
      expect(controls.length).toBeGreaterThan(0);
      for (const control of controls) {
        expect(control.id).toBeTruthy();
        expect(host.querySelector(`label[for="${control.id}"]`)).toBeTruthy();
      }
    });

    it('renders the five fields the design specifies', async () => {
      const { host } = await render();
      const names = Array.from(host.querySelectorAll<HTMLInputElement>('.field__input')).map((c) =>
        c.getAttribute('name'),
      );
      expect(names).toEqual(['name', 'email', 'phone', 'subject', 'message']);
    });

    it('marks only the telephone optional', async () => {
      const { host } = await render();
      const optional = Array.from(host.querySelectorAll<HTMLInputElement>('.field__input')).filter(
        (c) => !c.hasAttribute('required'),
      );
      expect(optional.map((c) => c.getAttribute('name'))).toEqual(['phone']);
    });

    it('uses input types that bring up the right mobile keyboard', async () => {
      const { host } = await render();
      expect(host.querySelector('#contact-email')?.getAttribute('type')).toBe('email');
      expect(host.querySelector('#contact-phone')?.getAttribute('type')).toBe('tel');
    });

    it('does not imitate the captcha widget', async () => {
      // The design mocks a checkbox and an "hCaptcha" wordmark. Imitating a
      // security control is worse than showing nothing; Phase 4 mounts the real
      // one in the empty slot.
      const { host } = await render();
      expect(host.innerHTML.toLowerCase()).not.toContain('captcha');
      expect(host.textContent).not.toContain('No soy un robot');
    });

    it('does not navigate away when submitted, since nothing is wired yet', async () => {
      const { host } = await render();
      const form = host.querySelector('form');
      const event = new Event('submit', { cancelable: true });
      form?.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('states', () => {
    it('shows the form when idle', async () => {
      const { host } = await render('idle');
      expect(host.querySelector('form')).toBeTruthy();
      expect(host.querySelector('.outcome')).toBeNull();
    });

    it('marks the submit button pending rather than inventing a spinner', async () => {
      const { host } = await render('pending');
      const submit = host.querySelector('button[type="submit"]');
      expect(submit?.getAttribute('aria-busy')).toBe('true');
    });

    it('replaces the form with a success panel once sent', async () => {
      const { host } = await render('sent');
      expect(host.querySelector('form')).toBeNull();
      expect(host.querySelector('.outcome__mark--ok')).toBeTruthy();
    });

    it('announces a failure, which the design has no state for at all', async () => {
      const { host } = await render('error');
      const outcome = host.querySelector('.outcome');
      expect(outcome?.getAttribute('role')).toBe('alert');
      expect(host.querySelector('.outcome__mark--error')).toBeTruthy();
    });

    it('returns to the form from either outcome', async () => {
      for (const state of ['sent', 'error'] as const) {
        const { host, component } = await render(state);
        host.querySelector<HTMLButtonElement>('.outcome__again')?.click();
        expect(component.status()).toBe('idle');
        TestBed.resetTestingModule();
      }
    });
  });

  describe('contact details', () => {
    it('comes from config rather than the template', async () => {
      const { host } = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const text = host.textContent ?? '';
      expect(text).toContain(config.phone);
      expect(text).toContain(config.email);
      expect(text).toContain(config.addressFull);
    });

    it('makes the phone and email actionable', async () => {
      const { host } = await render();
      const config = TestBed.inject(SITE_CONFIG);
      const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain(config.phoneHref);
      expect(hrefs).toContain(`mailto:${config.email}`);
      expect(hrefs).toContain(config.whatsappUrl);
    });
  });
});
