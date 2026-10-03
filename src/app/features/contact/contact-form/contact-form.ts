import { afterNextRender, Component, inject, LOCALE_ID, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  hidden,
  validate,
  validateTree,
  type TreeValidationResult,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { SendEnquiry } from '../../../application/contact/send-enquiry';
import { SITE_CONFIG } from '../../../core/config/site.config';
import {
  ENQUIRY_TYPES,
  validateEnquiry,
  type EnquiryField,
  type EnquiryType,
} from '../../../domain/contact/enquiry';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { PrivacyNotice } from '../../../shared/ui/privacy-notice/privacy-notice';
import { FALLBACK_LOCALE, toSupportedLocale } from '../../../../shared/i18n/negotiate-locale';

/**
 * The four states the form can be in.
 *
 * The design covers `idle` and `sent` only. `pending` and `error` were designed
 * here rather than improvised later: a form that can fail needs somewhere to
 * say so.
 */
export type ContactStatus = 'idle' | 'pending' | 'sent' | 'error';

/** Why sending failed, as far as the visitor needs to know. */
export type ContactFailure = 'rate_limited' | 'unavailable';

/** Everything the form edits, including the two fields that are not the enquiry. */
export interface ContactModel {
  name: string;
  email: string;
  phone: string;
  enquiryType: EnquiryType | '';
  company: string;
  subject: string;
  message: string;
  privacy: boolean;
  /** The honeypot. Hidden from people, so only a bot fills it. */
  website: string;
}

const EMPTY: ContactModel = {
  name: '',
  email: '',
  phone: '',
  enquiryType: '',
  company: '',
  subject: '',
  message: '',
  privacy: false,
  website: '',
};

type FormFieldName = EnquiryField | 'privacy';

@Component({
  selector: 'hb-contact-form',
  imports: [Button, FormField, FormRoot, Icon, PrivacyNotice, RouterLink],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactForm {
  protected readonly config = inject(SITE_CONFIG);
  protected readonly enquiryTypes = ENQUIRY_TYPES;

  private readonly sendEnquiry = inject(SendEnquiry);
  private readonly locale = toSupportedLocale(inject(LOCALE_ID)) ?? FALLBACK_LOCALE;

  readonly status = signal<ContactStatus>('idle');
  readonly failure = signal<ContactFailure | null>(null);

  /**
   * When the form became usable, for the server's too-fast check. Set after
   * the first browser render: the prerendered HTML is served long before
   * anyone can type into it.
   */
  private renderedAt: number | null = null;

  /** Public so tests can fill the form the way a person would. */
  readonly model = signal<ContactModel>({ ...EMPTY });

  protected readonly contactForm = form(
    this.model,
    (path) => {
      // Out of the DOM, not merely invisible, for anyone who is not an operator.
      hidden(path.company, ({ valueOf }) => valueOf(path.enquiryType) !== 'operator');

      validate(path.privacy, ({ value }) => (value() ? undefined : { kind: 'required' }));

      // The domain rules, verbatim -- the same function the server runs, so the
      // form can never accept what the endpoint will reject.
      validateTree(path, ({ value, fieldTree }) => {
        const result = validateEnquiry(value());
        if (result.ok) {
          return undefined;
        }
        return result.errors.map((error) => ({
          kind: error.code,
          fieldTree: fieldTree[error.field],
        }));
      });
    },
    { submission: { action: () => this.send() } },
  );

  constructor() {
    afterNextRender(() => {
      this.renderedAt = Date.now();
    });
  }

  /**
   * The error to show under a field, or null. Shown once the field has been
   * left (blur), not on every keystroke -- and for every field after a submit
   * attempt, which marks them all as touched.
   */
  protected errorFor(field: FormFieldName): string | null {
    const state = this.contactForm[field]();
    if (!state.touched()) {
      return null;
    }
    const [first] = state.errors();
    return first ? this.message(field, first.kind) : null;
  }

  protected reset(): void {
    this.failure.set(null);
    this.status.set('idle');
  }

  protected sendAnother(): void {
    this.model.set({ ...EMPTY });
    this.contactForm().reset();
    this.renderedAt = Date.now();
    this.reset();
  }

  private async send(): Promise<TreeValidationResult> {
    this.status.set('pending');
    const value = this.model();

    const outcome = await this.sendEnquiry.execute(value, {
      locale: this.locale,
      privacyAccepted: value.privacy,
      honeypot: value.website,
      elapsedMs: this.renderedAt === null ? 0 : Date.now() - this.renderedAt,
    });

    switch (outcome.status) {
      case 'sent':
        this.status.set('sent');
        return undefined;
      case 'invalid':
        // The server disagreed with the form. Unusual, but the visitor's text
        // stays put and the fields say what to fix.
        this.status.set('idle');
        return outcome.errors.map((error) => ({
          kind: error.code,
          fieldTree: this.contactForm[error.field],
        }));
      default:
        // The model is untouched, so "Reintentar" brings every word back.
        this.failure.set(outcome.status);
        this.status.set('error');
        return undefined;
    }
  }

  private message(field: FormFieldName, kind: string): string {
    if (kind === 'invalidEmail') {
      return $localize`:Field error|@@contact.error.email.invalid:Revisa el formato del email.`;
    }
    if (kind === 'tooLong') {
      return $localize`:Field error|@@contact.error.tooLong:Es demasiado largo.`;
    }
    switch (field) {
      case 'name':
        return $localize`:Field error|@@contact.error.name.required:Indica tu nombre.`;
      case 'email':
        return $localize`:Field error|@@contact.error.email.required:Indica tu email.`;
      case 'enquiryType':
        return $localize`:Field error|@@contact.error.type.required:Elige el tipo de consulta.`;
      case 'company':
        return $localize`:Field error|@@contact.error.company.required:Indica el nombre de tu empresa.`;
      case 'subject':
        return $localize`:Field error|@@contact.error.subject.required:Indica el asunto.`;
      case 'message':
        return $localize`:Field error|@@contact.error.message.required:Escribe tu mensaje.`;
      case 'privacy':
        return $localize`:Field error|@@contact.error.privacy.required:Debes aceptar la política de privacidad.`;
      default:
        return $localize`:Field error|@@contact.error.generic:Revisa este campo.`;
    }
  }
}
