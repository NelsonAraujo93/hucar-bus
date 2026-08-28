/**
 * Phase 4B T1 spike: does a Vercel Function run on this deployment at all?
 *
 * This is not a rhetorical question. The project builds to `outputMode:
 * "static"` with a custom `outputDirectory`, and there is no framework server
 * -- so nothing about the setup guarantees that `/api/*` is picked up. Phase 1
 * asked the same question of Routing Middleware and the answer happened to be
 * yes; that is not evidence about functions.
 *
 * The contact form is built against this. If it does not work the plan says to
 * stop and report rather than improvise, so this route exists to get an answer
 * before any of that is written.
 *
 * Uses the Web `Request`/`Response` signature, matching middleware.ts, so no
 * Vercel types package is needed.
 *
 * **Temporary.** Delete once the form is wired, or keep it deliberately as an
 * uptime probe -- but decide, rather than leaving a diagnostic endpoint in
 * production by accident.
 */
export function GET(request: Request): Response {
  return Response.json(
    {
      ok: true,
      // Confirms the function is executing rather than a static file being
      // served from a coincidentally matching path.
      now: new Date().toISOString(),
      runtime: typeof process === 'undefined' ? 'edge-like' : `node ${process.version}`,
      region: process.env['VERCEL_REGION'] ?? null,
      deployment: process.env['VERCEL_ENV'] ?? null,
      path: new URL(request.url).pathname,

      // Presence only, never values. This tells us whether Vercel's environment
      // reaches a function before the real endpoint depends on it, and it is
      // the reason a secret must never be echoed from a handler.
      env: {
        RESEND_API_KEY: Boolean(process.env['RESEND_API_KEY']),
        CONTACT_TO_EMAIL: Boolean(process.env['CONTACT_TO_EMAIL']),
        HCAPTCHA_SECRET: Boolean(process.env['HCAPTCHA_SECRET']),
      },
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
