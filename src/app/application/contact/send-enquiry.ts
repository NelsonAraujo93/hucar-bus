import { inject, Service } from '@angular/core';
import { validateEnquiry } from '../../domain/contact/enquiry';
import { CONTACT_GATEWAY, type ContactSubmission, type SendOutcome } from './contact-gateway';

/**
 * Sends a contact enquiry: validate with the shared domain rules, then hand it
 * to the gateway.
 *
 * Validating here as well as in the form is not redundancy for its own sake.
 * The form's validators decide what a person sees; this decides what is
 * allowed to leave the browser, and it is the same function the server runs.
 */
@Service()
export class SendEnquiry {
  private readonly gateway = inject(CONTACT_GATEWAY);

  async execute(input: unknown, context: Omit<ContactSubmission, 'enquiry'>): Promise<SendOutcome> {
    const validated = validateEnquiry(input);
    if (!validated.ok) {
      return { status: 'invalid', errors: validated.errors };
    }
    return this.gateway.send({ ...context, enquiry: validated.value });
  }
}
