import { handleContact, type ContactDeps } from './handler';
import { createRateLimiter } from './rate-limit';
import type { OutgoingEmail, SendResult } from './resend';

const NOW = 1_800_000_000_000;

function body(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'María Hernández',
    email: 'maria@example.com',
    phone: '',
    enquiryType: 'customer',
    company: '',
    subject: 'Traslado al aeropuerto',
    message: 'Somos cuatro, llegamos el martes.',
    privacyAccepted: true,
    locale: 'es',
    website: '',
    elapsedMs: 12_000,
    ...overrides,
  };
}

function post(payload: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://hucarbus.com/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

interface Harness {
  readonly deps: ContactDeps;
  readonly sent: OutgoingEmail[];
  readonly logs: string[];
}

function harness(
  options: { results?: SendResult[]; configured?: boolean; limit?: number } = {},
): Harness {
  const sent: OutgoingEmail[] = [];
  const logs: string[] = [];
  const results = [...(options.results ?? [])];
  const configured = options.configured ?? true;

  return {
    sent,
    logs,
    deps: {
      send: configured
        ? async (email): Promise<SendResult> => {
            sent.push(email);
            return results.shift() ?? { ok: true, id: `id-${sent.length}` };
          }
        : null,
      addresses: configured ? { from: 'hola@hucarbus.com', inbox: 'inbox@example.com' } : null,
      limiter: createRateLimiter({ limit: options.limit ?? 5, windowMs: 60_000 }),
      now: () => NOW,
      log: (event, detail) => logs.push(detail ? `${event} ${JSON.stringify(detail)}` : event),
    },
  };
}

async function json(response: Response): Promise<unknown> {
  return response.json();
}

describe('handleContact', () => {
  it('delivers the enquiry and acknowledges the sender', async () => {
    const { deps, sent } = harness();

    const response = await handleContact(post(body()), deps);

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ ok: true });
    expect(sent.map((email) => email.to)).toEqual(['inbox@example.com', 'maria@example.com']);
    expect(sent[0].replyTo).toBe('maria@example.com');
    expect(sent[1].replyTo).toBe('inbox@example.com');
  });

  it('never caches a response', async () => {
    const response = await handleContact(post(body()), harness().deps);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects anything but POST without sending', async () => {
    const { deps, sent } = harness();

    const response = await handleContact(
      new Request('https://hucarbus.com/api/contact', { method: 'GET' }),
      deps,
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(sent).toEqual([]);
  });

  describe('rate limiting', () => {
    it('refuses once a client exceeds the limit, before parsing anything', async () => {
      const { deps, sent } = harness({ limit: 1 });

      expect((await handleContact(post(body()), deps)).status).toBe(200);
      const second = await handleContact(post('not even json'), deps);

      expect(second.status).toBe(429);
      expect(await json(second)).toEqual({ ok: false, error: 'rate_limited' });
      expect(sent).toHaveLength(2);
    });

    it('counts each client separately', async () => {
      const { deps } = harness({ limit: 1 });

      await handleContact(post(body()), deps);
      const other = await handleContact(post(body(), { 'x-forwarded-for': '198.51.100.1' }), deps);

      expect(other.status).toBe(200);
    });

    it('keys on the first forwarded address, which is the client', async () => {
      const { deps } = harness({ limit: 1 });

      await handleContact(post(body(), { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }), deps);
      const again = await handleContact(
        post(body(), { 'x-forwarded-for': '203.0.113.7, 10.0.0.2' }),
        deps,
      );

      expect(again.status).toBe(429);
    });

    it('falls back to x-real-ip, then to a shared bucket', async () => {
      const { deps } = harness({ limit: 1 });
      const bare = (headers: Record<string, string>): Request =>
        new Request('https://hucarbus.com/api/contact', {
          method: 'POST',
          headers,
          body: JSON.stringify(body()),
        });

      expect((await handleContact(bare({ 'x-real-ip': '192.0.2.1' }), deps)).status).toBe(200);
      expect((await handleContact(bare({}), deps)).status).toBe(200);
      expect((await handleContact(bare({}), deps)).status).toBe(429);
    });
  });

  describe('malformed requests', () => {
    it.each([
      ['invalid JSON', '{'],
      ['a JSON array', '[]'],
      ['a JSON string', '"hola"'],
      ['JSON null', 'null'],
    ])('rejects %s', async (_label, payload) => {
      const response = await handleContact(post(payload), harness().deps);
      expect(response.status).toBe(400);
      expect(await json(response)).toEqual({ ok: false, error: 'bad_request' });
    });

    it('rejects an oversized body without parsing it', async () => {
      const response = await handleContact(
        post(body({ message: 'x'.repeat(20_000) })),
        harness().deps,
      );
      expect(response.status).toBe(413);
    });

    it('rejects a submission that never accepted the privacy policy', async () => {
      const { deps, sent } = harness();

      const response = await handleContact(post(body({ privacyAccepted: 'yes' })), deps);

      expect(response.status).toBe(400);
      expect(sent).toEqual([]);
    });
  });

  describe('spam', () => {
    it('answers a filled honeypot with success and sends nothing', async () => {
      const { deps, sent, logs } = harness();

      const response = await handleContact(post(body({ website: 'https://spam.example' })), deps);

      expect(response.status).toBe(200);
      expect(await json(response)).toEqual({ ok: true });
      expect(sent).toEqual([]);
      expect(logs).toEqual(['contact.dropped {"reason":"honeypot"}']);
    });

    it('ignores a honeypot that holds only whitespace', async () => {
      const { deps, sent } = harness();
      await handleContact(post(body({ website: '   ' })), deps);
      expect(sent).toHaveLength(2);
    });

    it.each([
      ['too fast', 900],
      ['missing', undefined],
      ['not a number', '5000'],
      ['not finite', 'Infinity'],
    ])('drops a submission whose fill time is %s', async (_label, elapsedMs) => {
      const { deps, sent, logs } = harness();

      const payload =
        elapsedMs === 'Infinity'
          ? JSON.stringify(body()).replace('"elapsedMs":12000', '"elapsedMs":1e999')
          : body({ elapsedMs });
      const response = await handleContact(post(payload), deps);

      expect(response.status).toBe(200);
      expect(sent).toEqual([]);
      expect(logs).toEqual(['contact.dropped {"reason":"too_fast"}']);
    });

    it('accepts a submission at exactly the minimum fill time', async () => {
      const { deps, sent } = harness();
      await handleContact(post(body({ elapsedMs: 3_000 })), deps);
      expect(sent).toHaveLength(2);
    });
  });

  describe('validation', () => {
    it('returns the field errors and sends nothing', async () => {
      const { deps, sent } = harness();

      const response = await handleContact(post(body({ email: 'nope', message: ' ' })), deps);

      expect(response.status).toBe(400);
      expect(await json(response)).toEqual({
        ok: false,
        error: 'invalid',
        errors: [
          { field: 'message', code: 'required' },
          { field: 'email', code: 'invalidEmail' },
        ],
      });
      expect(sent).toEqual([]);
    });
  });

  describe('configuration', () => {
    it('refuses honestly when the email environment is missing', async () => {
      const { deps, logs } = harness({ configured: false });

      const response = await handleContact(post(body()), deps);

      expect(response.status).toBe(503);
      expect(await json(response)).toEqual({ ok: false, error: 'unavailable' });
      expect(logs).toEqual(['contact.not_configured']);
    });
  });

  describe('delivery', () => {
    it('reports a failed delivery as unavailable and skips the acknowledgement', async () => {
      const { deps, sent, logs } = harness({ results: [{ ok: false, status: 500 }] });

      const response = await handleContact(post(body()), deps);

      expect(response.status).toBe(502);
      expect(await json(response)).toEqual({ ok: false, error: 'unavailable' });
      expect(sent).toHaveLength(1);
      expect(logs).toEqual(['contact.delivery_failed {"status":500}']);
    });

    it('still succeeds when only the acknowledgement fails', async () => {
      const { deps, logs } = harness({
        results: [
          { ok: true, id: 'abc' },
          { ok: false, status: 422 },
        ],
      });

      const response = await handleContact(post(body()), deps);

      expect(response.status).toBe(200);
      expect(logs).toEqual([
        'contact.delivered {"id":"abc","type":"customer","locale":"es"}',
        'contact.acknowledgement_failed {"status":422}',
      ]);
    });

    it('never logs what the visitor wrote', async () => {
      const { deps, logs } = harness({ results: [{ ok: false, status: 500 }] });

      await handleContact(post(body()), deps);
      await handleContact(post(body({ email: 'bad' })), deps);

      const everything = logs.join('\n');
      for (const value of ['María', 'maria@example.com', 'Traslado', 'Somos cuatro']) {
        expect(everything).not.toContain(value);
      }
    });

    it('acknowledges in the language of the site used', async () => {
      const { deps, sent } = harness();
      await handleContact(post(body({ locale: 'en' })), deps);
      expect(sent[1].subject).toContain("We've received");
    });

    it.each([
      ['an unknown locale', 'fr'],
      ['a missing locale', undefined],
    ])('answers %s in English, the site fallback', async (_label, locale) => {
      const { deps, sent } = harness();
      await handleContact(post(body({ locale })), deps);
      expect(sent[1].subject).toContain("We've received");
      expect(sent[1].text).toContain('+34 677 87 35 89');
    });
  });
});
