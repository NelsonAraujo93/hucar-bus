import { InjectionToken, inject, Service } from '@angular/core';
import type {
  ContactGateway,
  ContactSubmission,
  SendOutcome,
} from '../../application/contact/contact-gateway';
import {
  CONTACT_ENDPOINT,
  HONEYPOT_FIELD,
  type ContactRequestBody,
  type ContactResponseBody,
} from '../../../shared/contact/protocol';

/**
 * `fetch`, injectable so tests can answer for the network.
 *
 * Plain fetch rather than HttpClient: this is the app's only request, and
 * HttpClient would add its weight to the initial bundle of every visitor to
 * serve one form most of them never send.
 */
export const FETCH = new InjectionToken<typeof fetch>('hb.fetch', {
  providedIn: 'root',
  factory: () => globalThis.fetch.bind(globalThis),
});

/** Posts an enquiry to `/api/contact` and turns the answer into an outcome. */
@Service()
export class HttpContactGateway implements ContactGateway {
  private readonly fetch = inject(FETCH);

  async send(submission: ContactSubmission): Promise<SendOutcome> {
    const { enquiry } = submission;
    const body: ContactRequestBody = {
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone ?? '',
      enquiryType: enquiry.enquiryType,
      company: enquiry.company ?? '',
      subject: enquiry.subject,
      message: enquiry.message,
      privacyAccepted: submission.privacyAccepted,
      locale: submission.locale,
      [HONEYPOT_FIELD]: submission.honeypot,
      elapsedMs: submission.elapsedMs,
    };

    let response: Response;
    try {
      // The trailing slash matches vercel.json's trailingSlash, so the POST is
      // not answered with a redirect first.
      response = await this.fetch(`${CONTACT_ENDPOINT}/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      return { status: 'unavailable' };
    }

    if (response.status === 429) {
      return { status: 'rate_limited' };
    }

    const answer = (await response.json().catch(() => null)) as ContactResponseBody | null;
    if (response.ok && answer?.ok === true) {
      return { status: 'sent' };
    }
    if (answer?.ok === false && answer.error === 'invalid') {
      return { status: 'invalid', errors: answer.errors };
    }
    return { status: 'unavailable' };
  }
}
