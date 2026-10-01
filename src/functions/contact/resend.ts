/**
 * Sends one email through Resend's HTTPS API.
 *
 * Plain `fetch` rather than the SDK: one endpoint, one request shape, and
 * nothing to keep updated. HTTPS rather than SMTP because a serverless
 * function handles a short request far better than a TCP session.
 */
export interface OutgoingEmail {
  readonly from: string;
  readonly to: string;
  readonly replyTo: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export type SendResult =
  { readonly ok: true; readonly id: string } | { readonly ok: false; readonly status: number };

export type EmailSender = (email: OutgoingEmail) => Promise<SendResult>;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function createResendSender(apiKey: string, fetchFn: typeof fetch = fetch): EmailSender {
  return async (email) => {
    let response: Response;
    try {
      response = await fetchFn(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          reply_to: email.replyTo,
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });
    } catch {
      // Network failure before any status existed. 0 is what a browser reports
      // for the same situation, and it cannot be mistaken for a real response.
      return { ok: false, status: 0 };
    }

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const body = (await response.json().catch(() => ({}))) as { id?: unknown };
    return { ok: true, id: typeof body.id === 'string' ? body.id : '' };
  };
}
