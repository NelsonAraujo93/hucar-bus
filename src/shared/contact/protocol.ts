import type { FieldError } from '../../app/domain/contact/enquiry';
import type { SupportedLocale } from '../i18n/negotiate-locale';

/**
 * The wire contract between the contact form and `/api/contact`.
 *
 * One definition, imported by both ends, so a renamed field is a compile error
 * on the side that forgot rather than a form that silently stops delivering.
 * Type-only imports keep it free of runtime dependencies: the function loads
 * it as a native ES module, where an extensionless import would not resolve.
 */

export const CONTACT_ENDPOINT = '/api/contact';

/**
 * The honeypot: a field a person never sees and so never fills.
 *
 * Named like something a bot wants to complete. A field called "honeypot" is
 * one the better bots have learned to leave alone.
 */
export const HONEYPOT_FIELD = 'website';

/**
 * Below this, a submission was not typed by a person.
 *
 * The form has at least five fields and a checkbox. Three seconds is generous
 * to autofill and still far slower than a script posting on page load.
 */
export const MIN_FILL_MS = 3_000;

/** What the form posts. Every field is re-validated server-side regardless. */
export interface ContactRequestBody {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly enquiryType: string;
  readonly company: string;
  readonly subject: string;
  readonly message: string;
  readonly privacyAccepted: boolean;
  readonly locale: SupportedLocale;
  readonly [HONEYPOT_FIELD]: string;
  /** Milliseconds between the form rendering and the submit press. */
  readonly elapsedMs: number;
}

/**
 * What the function answers. Deliberately coarse: a failure says what the
 * visitor can do about it, never why the server failed.
 */
export type ContactResponseBody =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: 'invalid'; readonly errors: readonly FieldError[] }
  | { readonly ok: false; readonly error: 'rate_limited' | 'unavailable' | 'bad_request' };
