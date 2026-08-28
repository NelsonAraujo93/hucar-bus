/**
 * Strips personal data out of an error event before it leaves the browser.
 *
 * Kept free of any Sentry import so it can be unit tested directly against
 * plain objects, and so the rules are readable without knowing the SDK.
 *
 * The threat is not that we deliberately attach a visitor's email to an event.
 * It is that an error thrown while handling the contact form carries the form's
 * contents incidentally -- in a message, a breadcrumb, a fetch body -- and
 * lands in a third-party processor nobody expected it to reach.
 */

/**
 * Field names whose values are always replaced, whatever they contain.
 *
 * Both languages, because the contact form's field names are English but the
 * copy, and anything a future handler interpolates, is Spanish.
 */
const PII_KEYS = new Set([
  'name',
  'email',
  'phone',
  'subject',
  'message',
  'nombre',
  'correo',
  'telefono',
  'teléfono',
  'asunto',
  'mensaje',
  'password',
  'token',
  'authorization',
]);

/** Anything shaped like an email address. */
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/**
 * Anything shaped like a phone number: at least nine characters of digits and
 * the separators people actually type, starting and ending on a digit.
 *
 * Applied only to prose -- breadcrumb text, exception messages, values under
 * the containers below. Never to stack traces, where offsets and line numbers
 * would match it and the frame would be destroyed for no privacy gain.
 */
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g;

export const REDACTED = '[redacted]';

/**
 * The parts of an event that can carry visitor input.
 *
 * An allowlist rather than a walk of the whole event: `exception.stacktrace` and
 * `sdk` must be left intact for the report to be worth anything, and a
 * catch-all walk would eventually reach them.
 */
const SCRUBBED_CONTAINERS = ['request', 'extra', 'contexts', 'tags'] as const;

function maskText(value: string): string {
  return value.replace(EMAIL_PATTERN, REDACTED).replace(PHONE_PATTERN, REDACTED);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Replaces values under a PII key outright, and masks what is left.
 *
 * Depth-limited. A cyclic or pathologically nested object must not turn error
 * reporting into a hang, and nothing legitimate in these containers is eight
 * levels deep.
 */
function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 8) {
    return REDACTED;
  }

  if (typeof value === 'string') {
    return maskText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }

  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = PII_KEYS.has(key.toLowerCase()) ? REDACTED : scrubValue(item, depth + 1);
    }
    return result;
  }

  return value;
}

/** The subset of a Sentry event this module touches. */
export interface ScrubbableEvent {
  user?: unknown;
  request?: unknown;
  extra?: unknown;
  contexts?: unknown;
  tags?: unknown;
  breadcrumbs?: unknown;
  exception?: { values?: { value?: string; [key: string]: unknown }[] };
  [key: string]: unknown;
}

/**
 * Scrubs an outgoing event in place of the SDK's defaults.
 *
 * `user` is removed rather than scrubbed. sendDefaultPii:false already stops
 * the SDK attaching an IP address, but nothing stops a future call to setUser,
 * and there is no user account on this site for one to be about.
 */
export function scrubEvent(event: ScrubbableEvent): ScrubbableEvent {
  const scrubbed: ScrubbableEvent = { ...event };

  delete scrubbed['user'];

  for (const container of SCRUBBED_CONTAINERS) {
    if (scrubbed[container] !== undefined) {
      scrubbed[container] = scrubValue(scrubbed[container]);
    }
  }

  if (Array.isArray(scrubbed['breadcrumbs'])) {
    scrubbed['breadcrumbs'] = scrubbed['breadcrumbs'].map((crumb) =>
      isRecord(crumb) ? scrubValue(crumb) : crumb,
    );
  }

  // The message, not the stack. A handler that interpolates form content into
  // an Error is the likeliest way a visitor's address ends up here.
  const values = scrubbed['exception'];
  if (isRecord(values) && Array.isArray(values['values'])) {
    values['values'] = values['values'].map((entry) =>
      isRecord(entry) && typeof entry['value'] === 'string'
        ? { ...entry, value: maskText(entry['value']) }
        : entry,
    );
  }

  return scrubbed;
}
