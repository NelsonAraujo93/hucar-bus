import { createResendSender } from '../../src/functions/contact/resend.js';
import { createInstagramRefresher, handleRotation } from '../../src/functions/instagram/rotate.js';
import { createTokenStore } from '../../src/functions/instagram/token-store.js';

/**
 * Vercel Cron entry point (see "crons" in vercel.json). Wiring only: the
 * logic and its tests live in src/functions/instagram/.
 */
export function GET(request: Request): Promise<Response> {
  const env = process.env;
  const restUrl = env['KV_REST_API_URL'];
  const restToken = env['KV_REST_API_TOKEN'];
  const hook = env['DEPLOY_HOOK_URL'];
  const resendKey = env['RESEND_API_KEY'];
  const inbox = env['CONTACT_TO_EMAIL'];
  const from = env['CONTACT_FROM_EMAIL'] ?? 'hola@hucarbus.com';
  const send = resendKey ? createResendSender(resendKey) : null;

  return handleRotation(request, {
    secret: env['CRON_SECRET'] ?? null,
    store: restUrl && restToken ? createTokenStore(restUrl, restToken) : null,
    seedToken: env['INSTAGRAM_ACCESS_TOKEN'] ?? null,
    refresh: createInstagramRefresher(),
    rebuild: async () => {
      if (!hook) {
        return false;
      }
      try {
        return (await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(10_000) })).ok;
      } catch {
        return false;
      }
    },
    // To the team's inbox, in Spanish: it is read by the team, not a customer.
    alert: async (reason) => {
      if (!send || !inbox) {
        return;
      }
      const text = [
        'El token de Instagram de hucarbus.com necesita atención.',
        '',
        reason,
        '',
        'El token actual sigue funcionando hasta que caduque (60 días desde su',
        'última renovación). Si no se resuelve, la sección de Instagram de la web',
        'se ocultará sola. Solución: generar un token nuevo en Meta for Developers',
        'y guardarlo en Vercel como INSTAGRAM_ACCESS_TOKEN.',
      ].join('\n');
      await send({
        from: `Hucar Bus Web <${from}>`,
        to: inbox,
        replyTo: inbox,
        subject: '[Web] Renovación del token de Instagram',
        text,
        html: `<pre style="font-family:inherit;white-space:pre-wrap">${text}</pre>`,
      });
    },
    now: () => Date.now(),
    log: (event, detail) => console.info(JSON.stringify({ event, ...detail })),
  });
}
