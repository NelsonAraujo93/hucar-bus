import { validateEnquiry } from '../../app/domain/contact/enquiry.js';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../../shared/i18n/negotiate-locale.js';
import {
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  type ContactResponseBody,
} from '../../shared/contact/protocol.js';
import { acknowledgementEmail, notificationEmail, type Addresses } from './messages.js';
import type { RateLimiter } from './rate-limit.js';
import type { EmailSender } from './resend.js';

/**
 * `/api/contact`, as a plain function of a Request.
 *
 * Everything with side effects arrives through `deps`, so the whole order of
 * operations is testable without a network, a clock or an inbox.
 *
 * Imports carry `.js` extensions: Vercel runs this as a native ES module
 * without bundling, and Node resolves no extensionless relative import.
 */

export interface ContactDeps {
  /** `null` when the environment is not configured: the endpoint then refuses honestly. */
  readonly send: EmailSender | null;
  readonly addresses: Addresses | null;
  readonly limiter: RateLimiter;
  readonly now: () => number;
  /**
   * Structured, personal-data-free log lines. Never pass the enquiry: these end
   * up in the hosting provider's logs, which the privacy policy does not
   * describe as holding visitor messages.
   */
  readonly log: (event: string, detail?: Record<string, string | number | boolean>) => void;
}

/** Comfortably above the largest valid enquiry; anything bigger is not a form submission. */
const MAX_BODY_BYTES = 16_384;

function reply(status: number, body: ContactResponseBody, headers: HeadersInit = {}): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

/**
 * The client's address as Vercel reports it. The first entry of
 * x-forwarded-for is the one the edge saw; the rest are proxies.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

function toLocale(value: unknown): SupportedLocale {
  return SUPPORTED_LOCALES.find((locale) => locale === value) ?? 'es';
}

export async function handleContact(request: Request, deps: ContactDeps): Promise<Response> {
  if (request.method !== 'POST') {
    return reply(405, { ok: false, error: 'bad_request' }, { allow: 'POST' });
  }

  // Before anything is parsed: a flood should cost as little as possible.
  if (!deps.limiter.hit(clientKey(request), deps.now())) {
    deps.log('contact.rate_limited');
    return reply(429, { ok: false, error: 'rate_limited' });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply(413, { ok: false, error: 'bad_request' });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return reply(400, { ok: false, error: 'bad_request' });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, error: 'bad_request' });
  }

  // Spam is answered with success. A rejection teaches a bot which field gave
  // it away; a 200 teaches it nothing and costs us nothing to send.
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    deps.log('contact.dropped', { reason: 'honeypot' });
    return reply(200, { ok: true });
  }
  const elapsed = body['elapsedMs'];
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    deps.log('contact.dropped', { reason: 'too_fast' });
    return reply(200, { ok: true });
  }

  // The form will not submit without it, so its absence means the request did
  // not come from the form.
  if (body['privacyAccepted'] !== true) {
    return reply(400, { ok: false, error: 'bad_request' });
  }

  const validated = validateEnquiry(body);
  if (!validated.ok) {
    return reply(400, { ok: false, error: 'invalid', errors: validated.errors });
  }

  if (deps.send === null || deps.addresses === null) {
    deps.log('contact.not_configured');
    return reply(503, { ok: false, error: 'unavailable' });
  }

  const locale = toLocale(body['locale']);
  const enquiry = validated.value;

  const delivered = await deps.send(notificationEmail(enquiry, locale, deps.addresses));
  if (!delivered.ok) {
    deps.log('contact.delivery_failed', { status: delivered.status });
    return reply(502, { ok: false, error: 'unavailable' });
  }
  deps.log('contact.delivered', { id: delivered.id, type: enquiry.enquiryType, locale });

  // The enquiry has reached the client by now. A failed receipt is worth a log
  // line, not a failure the visitor would retry -- and so send twice.
  const acknowledged = await deps.send(acknowledgementEmail(enquiry.email, locale, deps.addresses));
  if (!acknowledged.ok) {
    deps.log('contact.acknowledgement_failed', { status: acknowledged.status });
  }

  return reply(200, { ok: true });
}
