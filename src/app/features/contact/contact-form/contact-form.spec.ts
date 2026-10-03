import { LOCALE_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  CONTACT_GATEWAY,
  type ContactGateway,
  type ContactSubmission,
  type SendOutcome,
} from '../../../application/contact/contact-gateway';
import { ContactForm, type ContactModel } from './contact-form';

class FakeGateway implements ContactGateway {
  readonly calls: ContactSubmission[] = [];
  next: SendOutcome = { status: 'sent' };
  /** When set, send() waits on it, to observe the pending state. */
  gate: Promise<void> | null = null;

  async send(submission: ContactSubmission): Promise<SendOutcome> {
    this.calls.push(submission);
    if (this.gate) {
      await this.gate;
    }
    return this.next;
  }
}

interface Rendered {
  readonly fixture: ComponentFixture<ContactForm>;
  readonly host: HTMLElement;
  readonly component: ContactForm;
  readonly gateway: FakeGateway;
}

async function render(locale = 'es'): Promise<Rendered> {
  const gateway = new FakeGateway();
  TestBed.configureTestingModule({
    imports: [ContactForm],
    providers: [
      provideRouter([]),
      { provide: CONTACT_GATEWAY, useValue: gateway },
      { provide: LOCALE_ID, useValue: locale },
    ],
  });
  const fixture = TestBed.createComponent(ContactForm);
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    component: fixture.componentInstance,
    gateway,
  };
}

const VALID: ContactModel = {
  name: '  María Hernández ',
  email: 'maria@example.com',
  phone: '',
  enquiryType: 'customer',
  company: '',
  subject: 'Traslado al aeropuerto',
  message: 'Somos cuatro, llegamos el martes.',
  privacy: true,
  website: '',
};

async function fill(rendered: Rendered, overrides: Partial<ContactModel> = {}): Promise<void> {
  rendered.component.model.set({ ...VALID, ...overrides });
  await rendered.fixture.whenStable();
}

async function submit({ fixture, host }: Rendered): Promise<void> {
  host.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
  await fixture.whenStable();
}

function type(host: HTMLElement, selector: string, value: string): void {
  const control = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!control) {
    throw new Error(`no control ${selector}`);
  }
  control.value = value;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('blur'));
}

function errorTexts(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll('.field__error')).map((e) => e.textContent?.trim() ?? '');
}

describe('ContactForm', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('fields', () => {
    it('pairs every input with a label', async () => {
      // Placeholder-only fields are unusable with a screen reader.
      const { host } = await render();
      const controls = Array.from(host.querySelectorAll<HTMLElement>('.field__input'));
      expect(controls.length).toBe(5);
      for (const control of controls) {
        expect(host.querySelector(`label[for="${control.id}"]`)).toBeTruthy();
      }
      expect(host.querySelector('label[for="contact-privacy"]')).toBeTruthy();
    });

    it('asks who is writing as one labelled group', async () => {
      const { host } = await render();
      const group = host.querySelector('fieldset.choice');
      expect(group?.querySelector('legend')?.textContent).toContain('¿Quién nos escribe?');
      expect(group?.querySelectorAll('input[type="radio"]')).toHaveLength(3);
    });

    it('uses input types and autocomplete that suit each field', async () => {
      const { host } = await render();
      expect(host.querySelector('#contact-email')?.getAttribute('type')).toBe('email');
      expect(host.querySelector('#contact-email')?.getAttribute('autocomplete')).toBe('email');
      expect(host.querySelector('#contact-phone')?.getAttribute('type')).toBe('tel');
      expect(host.querySelector('#contact-name')?.getAttribute('autocomplete')).toBe('name');
    });

    it('asks for a company only when an operator is writing, and keeps it out of the DOM otherwise', async () => {
      const rendered = await render();
      expect(rendered.host.querySelector('#contact-company')).toBeNull();

      rendered.host.querySelector<HTMLInputElement>('input[value="operator"]')?.click();
      await rendered.fixture.whenStable();

      expect(rendered.component.model().enquiryType).toBe('operator');
      expect(rendered.host.querySelector('#contact-company')).toBeTruthy();
    });

    it('binds what a person types into the model', async () => {
      const rendered = await render();
      type(rendered.host, '#contact-name', 'Ana');
      type(rendered.host, '#contact-message', 'Hola');
      await rendered.fixture.whenStable();

      expect(rendered.component.model().name).toBe('Ana');
      expect(rendered.component.model().message).toBe('Hola');
    });

    it('links the privacy policy from the checkbox label', async () => {
      const { host } = await render();
      const link = host.querySelector('.consent__label a');
      expect(link?.getAttribute('href')).toBe('/privacidad');
    });

    it('shows the basic data-protection information before the privacy box', async () => {
      const { host } = await render();
      const notice = host.querySelector('hb-privacy-notice');
      const box = host.querySelector('#contact-privacy');
      expect(notice).toBeTruthy();
      expect(
        notice && box && notice.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('starts with the privacy box unticked', async () => {
      const { host } = await render();
      expect(host.querySelector<HTMLInputElement>('#contact-privacy')?.checked).toBe(false);
    });

    it('hides the honeypot from people and assistive technology', async () => {
      const { host } = await render();
      const trap = host.querySelector('.trap');
      expect(trap?.getAttribute('aria-hidden')).toBe('true');
      expect(trap?.querySelector('input')?.getAttribute('tabindex')).toBe('-1');
      expect(trap?.querySelector('input')?.getAttribute('autocomplete')).toBe('off');
    });

    it('posts natively if JavaScript never ran, so fields never reach the URL', async () => {
      const { host } = await render();
      expect(host.querySelector('form')?.getAttribute('method')).toBe('post');
    });

    it('does not imitate the captcha widget', async () => {
      const { host } = await render();
      expect(host.innerHTML.toLowerCase()).not.toContain('captcha');
    });
  });

  describe('validation', () => {
    it('shows no errors before anything is touched', async () => {
      const { host } = await render();
      expect(errorTexts(host)).toEqual([]);
    });

    it('shows an error once a field is left, not on every keystroke', async () => {
      const rendered = await render();
      type(rendered.host, '#contact-email', 'not-an-email');
      await rendered.fixture.whenStable();

      expect(errorTexts(rendered.host)).toEqual(['Revisa el formato del email.']);
      const email = rendered.host.querySelector('#contact-email');
      expect(email?.getAttribute('aria-invalid')).toBe('true');
      expect(email?.getAttribute('aria-describedby')).toBe('contact-email-error');
    });

    it('blocks an empty submission and explains every problem', async () => {
      const rendered = await render();
      await submit(rendered);

      expect(rendered.gateway.calls).toEqual([]);
      expect(errorTexts(rendered.host)).toEqual([
        'Elige el tipo de consulta.',
        'Indica tu nombre.',
        'Indica tu email.',
        'Indica el asunto.',
        'Escribe tu mensaje.',
        'Debes aceptar la política de privacidad.',
      ]);
    });

    it('requires the company for an operator', async () => {
      const rendered = await render();
      await fill(rendered, { enquiryType: 'operator' });
      await submit(rendered);

      expect(rendered.gateway.calls).toEqual([]);
      expect(errorTexts(rendered.host)).toEqual(['Indica el nombre de tu empresa.']);
    });

    it('reports an over-long field', async () => {
      const rendered = await render();
      await fill(rendered, { subject: 'x'.repeat(151) });
      await submit(rendered);

      expect(errorTexts(rendered.host)).toEqual(['Es demasiado largo.']);
    });
  });

  describe('submission', () => {
    it('sends the cleaned enquiry with the context the server checks', async () => {
      const rendered = await render();
      await fill(rendered);
      await submit(rendered);

      expect(rendered.gateway.calls).toHaveLength(1);
      const [sent] = rendered.gateway.calls;
      expect(sent.enquiry).toEqual({
        name: 'María Hernández',
        email: 'maria@example.com',
        enquiryType: 'customer',
        subject: 'Traslado al aeropuerto',
        message: 'Somos cuatro, llegamos el martes.',
      });
      expect(sent.locale).toBe('es');
      expect(sent.privacyAccepted).toBe(true);
      expect(sent.honeypot).toBe('');
      expect(sent.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('measures fill time from when the form became usable', async () => {
      const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
      try {
        const rendered = await render();
        await fill(rendered);
        now.mockReturnValue(9_500);
        await submit(rendered);

        expect(rendered.gateway.calls[0].elapsedMs).toBe(8_500);
      } finally {
        now.mockRestore();
      }
    });

    it('passes the honeypot through for the server to judge', async () => {
      const rendered = await render();
      await fill(rendered, { website: 'https://spam.example' });
      await submit(rendered);
      expect(rendered.gateway.calls[0].honeypot).toBe('https://spam.example');
    });

    it('tells the server which language the visitor used', async () => {
      const rendered = await render('en-GB');
      await fill(rendered);
      await submit(rendered);
      expect(rendered.gateway.calls[0].locale).toBe('en');
    });

    it('marks the button busy while sending', async () => {
      const rendered = await render();
      let release!: () => void;
      rendered.gateway.gate = new Promise((resolve) => (release = resolve));
      await fill(rendered);

      rendered.host.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      await Promise.resolve();
      rendered.fixture.detectChanges();

      expect(rendered.component.status()).toBe('pending');
      const button = rendered.host.querySelector('button[type="submit"]');
      expect(button?.getAttribute('aria-busy')).toBe('true');
      expect(rendered.host.querySelector('[aria-live="polite"]')?.textContent).toContain(
        'Enviando',
      );

      release();
      await vi.waitFor(() => expect(rendered.component.status()).toBe('sent'));
    });

    it('shows the success panel and sets the payment-link expectation', async () => {
      const rendered = await render();
      await fill(rendered);
      await submit(rendered);

      expect(rendered.host.querySelector('form')).toBeNull();
      expect(rendered.host.querySelector('.outcome__mark--ok')).toBeTruthy();
      expect(rendered.host.textContent).toContain('enlace de pago seguro');
      expect(rendered.host.querySelector('[aria-live="polite"]')?.textContent).toContain(
        'Mensaje enviado',
      );
    });

    it('starts afresh when sending another', async () => {
      const rendered = await render();
      await fill(rendered);
      await submit(rendered);

      rendered.host.querySelector<HTMLButtonElement>('.outcome__again')?.click();
      await rendered.fixture.whenStable();

      expect(rendered.component.status()).toBe('idle');
      expect(rendered.component.model().name).toBe('');
      expect(errorTexts(rendered.host)).toEqual([]);
    });
  });

  describe('failure', () => {
    it('keeps every word when delivery fails, and offers WhatsApp', async () => {
      const rendered = await render();
      rendered.gateway.next = { status: 'unavailable' };
      await fill(rendered);
      await submit(rendered);

      const outcome = rendered.host.querySelector('.outcome');
      expect(outcome?.getAttribute('role')).toBe('alert');
      expect(outcome?.textContent).toContain('Inténtalo de nuevo');
      expect(outcome?.querySelector('a[href^="https://wa.me/"]')).toBeTruthy();

      rendered.host.querySelector<HTMLButtonElement>('.outcome__again')?.click();
      await rendered.fixture.whenStable();

      expect(rendered.component.status()).toBe('idle');
      expect(rendered.host.querySelector<HTMLTextAreaElement>('#contact-message')?.value).toBe(
        VALID.message,
      );
    });

    it('says so plainly when the visitor has been rate limited', async () => {
      const rendered = await render();
      rendered.gateway.next = { status: 'rate_limited' };
      await fill(rendered);
      await submit(rendered);

      expect(rendered.host.querySelector('.outcome')?.textContent).toContain(
        'varios mensajes seguidos',
      );
    });

    it('puts server-side validation errors back on the fields', async () => {
      const rendered = await render();
      rendered.gateway.next = {
        status: 'invalid',
        errors: [{ field: 'email', code: 'invalidEmail' }],
      };
      await fill(rendered);
      await submit(rendered);

      expect(rendered.component.status()).toBe('idle');
      expect(rendered.host.querySelector('form')).toBeTruthy();
      expect(errorTexts(rendered.host)).toEqual(['Revisa el formato del email.']);
    });
  });
});
