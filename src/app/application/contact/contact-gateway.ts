import { InjectionToken } from '@angular/core';
import type { ContactEnquiry, FieldError } from '../../domain/contact/enquiry';
import type { SupportedLocale } from '../../../shared/i18n/negotiate-locale';

/**
 * The port the contact use case sends through.
 *
 * The application decides *that* an enquiry is sent; how it travels is the
 * adapter's business. The component never sees HTTP, and tests swap in a fake
 * without touching a network.
 */

/** A validated enquiry plus what the server needs to tell a person from a script. */
export interface ContactSubmission {
  readonly enquiry: ContactEnquiry;
  readonly locale: SupportedLocale;
  readonly privacyAccepted: boolean;
  /** Whatever ended up in the honeypot field. A person leaves it empty. */
  readonly honeypot: string;
  readonly elapsedMs: number;
}

export type SendOutcome =
  | { readonly status: 'sent' }
  | { readonly status: 'invalid'; readonly errors: readonly FieldError[] }
  /** Too many attempts. Worth saying so: retrying immediately will not help. */
  | { readonly status: 'rate_limited' }
  /** Anything else. The visitor can retry later or switch to WhatsApp. */
  | { readonly status: 'unavailable' };

export interface ContactGateway {
  send(submission: ContactSubmission): Promise<SendOutcome>;
}

/** Bound to the HTTP adapter in the application config, the composition root. */
export const CONTACT_GATEWAY = new InjectionToken<ContactGateway>('hb.contactGateway');
