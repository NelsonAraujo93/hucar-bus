/**
 * The contact enquiry, and the rules for what makes one valid.
 *
 * Pure: no Angular, no HTTP, no locale. That is what lets the serverless
 * function import the very same rules the form uses, which matters because the
 * server must never trust client-side validation -- and re-implementing the
 * rules there is how the two drift apart and a "valid" submission starts being
 * rejected by the endpoint.
 *
 * Errors are codes, not sentences. The messages a visitor reads are $localize
 * strings in the component, because this module is shared with a function that
 * has no business knowing which language the form was submitted in.
 */

/**
 * Who is writing.
 *
 * New in Phase 4B and deliberate. The existing copy -- "escríbenos y te
 * respondemos en menos de 24 horas" -- was written for a tourist booking a
 * transfer, not for an operator proposing a partnership, and the business
 * wants both. It also lets the email subject be formatted per type, and makes
 * routing to a different address later a change of one line rather than a
 * change of shape.
 */
export const ENQUIRY_TYPES = ['customer', 'operator', 'other'] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export interface ContactEnquiry {
  readonly name: string;
  readonly email: string;
  /** Optional: plenty of people would rather be emailed back. */
  readonly phone?: string;
  readonly enquiryType: EnquiryType;
  /** Only meaningful when the enquiry is from an operator. */
  readonly company?: string;
  readonly subject: string;
  readonly message: string;
}

export type EnquiryField = keyof ContactEnquiry;

export type ErrorCode = 'required' | 'tooLong' | 'invalidEmail';

export interface FieldError {
  readonly field: EnquiryField;
  readonly code: ErrorCode;
}

export type Validated =
  | { readonly ok: true; readonly value: ContactEnquiry }
  | { readonly ok: false; readonly errors: readonly FieldError[] };

/**
 * Length ceilings, enforced on both sides.
 *
 * These are not a formatting preference. An unbounded message field is a free
 * megabyte of anything a bot cares to post, straight into an email and a log.
 */
export const LIMITS = {
  name: 100,
  email: 254, // RFC 5321 maximum for a forward path.
  phone: 40,
  company: 120,
  subject: 150,
  message: 5000,
} as const;

/**
 * Deliberately permissive: something, an @, something, a dot, something.
 *
 * Tightening this is a trap. Every "proper" email regex rejects addresses that
 * are legal and in use -- plus-addressing, new TLDs, apostrophes -- and the
 * only real proof an address works is a message arriving at it. The strict
 * check here is length; the shape check exists to catch a typo, not to
 * adjudicate RFC 5322.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

/**
 * Trims and validates raw input, returning either a clean enquiry or every
 * problem with it.
 *
 * Every error is collected rather than returning on the first: a form that
 * reveals one mistake at a time is a form people abandon.
 *
 * Takes `unknown` because the function receives whatever was posted to it,
 * which is not necessarily an object and is certainly not necessarily this one.
 */
export function validateEnquiry(input: unknown): Validated {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, errors: [{ field: 'name', code: 'required' }] };
  }

  const raw = input as Record<string, unknown>;
  const text = (key: string): string | undefined =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : undefined;

  const errors: FieldError[] = [];

  const name = text('name');
  const email = text('email');
  const phone = text('phone');
  const company = text('company');
  const subject = text('subject');
  const message = text('message');

  const enquiryType = ENQUIRY_TYPES.find((type) => type === raw['enquiryType']);

  for (const [field, value] of [
    ['name', name],
    ['email', email],
    ['subject', subject],
    ['message', message],
  ] as const) {
    if (isBlank(value)) {
      errors.push({ field, code: 'required' });
    }
  }

  if (enquiryType === undefined) {
    errors.push({ field: 'enquiryType', code: 'required' });
  }

  // Only an operator is asked for a company, so only an operator can omit one.
  if (enquiryType === 'operator' && isBlank(company)) {
    errors.push({ field: 'company', code: 'required' });
  }

  if (email !== undefined && !isBlank(email) && !EMAIL_SHAPE.test(email)) {
    errors.push({ field: 'email', code: 'invalidEmail' });
  }

  for (const [field, value] of [
    ['name', name],
    ['email', email],
    ['phone', phone],
    ['company', company],
    ['subject', subject],
    ['message', message],
  ] as const) {
    if (value !== undefined && value.length > LIMITS[field]) {
      errors.push({ field, code: 'tooLong' });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name: name as string,
      email: email as string,
      ...(isBlank(phone) ? {} : { phone: phone as string }),
      enquiryType: enquiryType as EnquiryType,
      // Dropped for anyone who is not an operator, so a stale value left in a
      // hidden field cannot ride along into the email.
      ...(enquiryType === 'operator' && !isBlank(company) ? { company: company as string } : {}),
      subject: subject as string,
      message: message as string,
    },
  };
}
