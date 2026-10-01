import { handleContact } from '../src/functions/contact/handler.js';
import { createRateLimiter } from '../src/functions/contact/rate-limit.js';
import { createResendSender } from '../src/functions/contact/resend.js';

/**
 * Vercel entry point for the contact form. Wiring only: the logic and its
 * tests live in src/functions/contact/.
 */

/**
 * Module scope, so it survives between requests on a warm instance. Five
 * submissions in ten minutes is more than any person sends and few enough to
 * blunt a script.
 */
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export function POST(request: Request): Promise<Response> {
  const apiKey = process.env['RESEND_API_KEY'];
  const inbox = process.env['CONTACT_TO_EMAIL'];
  const from = process.env['CONTACT_FROM_EMAIL'] ?? 'hola@hucarbus.com';

  return handleContact(request, {
    send: apiKey ? createResendSender(apiKey) : null,
    addresses: inbox ? { from, inbox } : null,
    limiter,
    now: () => Date.now(),
    log: (event, detail) => console.info(JSON.stringify({ event, ...detail })),
  });
}
