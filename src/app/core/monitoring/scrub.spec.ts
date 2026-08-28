import { REDACTED, scrubEvent, type ScrubbableEvent } from './scrub';

/** What the contact form would leak if nothing stopped it. */
const ENQUIRER = {
  name: 'María Hernández',
  email: 'maria@example.com',
  phone: '+34 677 87 18 61',
  subject: 'Traslado al aeropuerto',
  message: 'Somos cuatro, llegamos el martes.',
};

function json(event: ScrubbableEvent): string {
  return JSON.stringify(scrubEvent(event));
}

describe('scrubEvent', () => {
  it('removes the user object outright', () => {
    // sendDefaultPii:false stops the SDK attaching an IP, but nothing stops a
    // future setUser call, and this site has no user account to be about.
    const scrubbed = scrubEvent({ user: { ip_address: '81.44.0.1', id: 'abc' } });
    expect(scrubbed['user']).toBeUndefined();
  });

  describe('contact form values', () => {
    it('never reaches the payload from a request body', () => {
      const out = json({ request: { data: ENQUIRER } });
      for (const value of Object.values(ENQUIRER)) {
        expect(out).not.toContain(value);
      }
    });

    it('never reaches the payload from extra context', () => {
      const out = json({ extra: { formState: ENQUIRER } });
      for (const value of Object.values(ENQUIRER)) {
        expect(out).not.toContain(value);
      }
    });

    it('never reaches the payload from a breadcrumb', () => {
      const out = json({
        breadcrumbs: [{ category: 'fetch', data: { body: ENQUIRER } }],
      });
      for (const value of Object.values(ENQUIRER)) {
        expect(out).not.toContain(value);
      }
    });

    it('redacts by field name whatever the value is', () => {
      const scrubbed = scrubEvent({ extra: { message: 'anything at all' } });
      expect((scrubbed['extra'] as Record<string, unknown>)['message']).toBe(REDACTED);
    });

    it('matches the field name case-insensitively', () => {
      const scrubbed = scrubEvent({ extra: { Email: 'a@b.com', PHONE: '+34600111222' } });
      const extra = scrubbed['extra'] as Record<string, unknown>;
      expect(extra['Email']).toBe(REDACTED);
      expect(extra['PHONE']).toBe(REDACTED);
    });

    it('redacts the Spanish field names the copy uses too', () => {
      const scrubbed = scrubEvent({
        extra: { nombre: 'María', mensaje: 'Hola', asunto: 'Traslado', teléfono: '600111222' },
      });
      for (const value of Object.values(scrubbed['extra'] as Record<string, unknown>)) {
        expect(value).toBe(REDACTED);
      }
    });
  });

  describe('values that leak without a matching key', () => {
    it('masks an email address wherever it appears', () => {
      const out = json({ extra: { note: 'contacted maria@example.com about the transfer' } });
      expect(out).not.toContain('maria@example.com');
      expect(out).toContain(REDACTED);
    });

    it('masks a phone number wherever it appears', () => {
      const out = json({ extra: { note: 'called +34 677 87 18 61 twice' } });
      expect(out).not.toContain('677 87 18 61');
    });

    it('masks an email inside an exception message', () => {
      // A handler that interpolates form content into an Error is the likeliest
      // route by which a visitor's address ends up in the issue feed.
      const scrubbed = scrubEvent({
        exception: { values: [{ value: 'Failed to send to maria@example.com' }] },
      });
      const first = scrubbed.exception?.values?.[0];
      expect(first?.value).toBe(`Failed to send to ${REDACTED}`);
    });

    it('masks values nested deep inside a container', () => {
      const out = json({ contexts: { a: { b: { c: { d: 'maria@example.com' } } } } });
      expect(out).not.toContain('maria@example.com');
    });
  });

  describe('what it must not destroy', () => {
    it('leaves the stack trace intact', () => {
      // Line and column offsets match the phone pattern. Scrubbing them would
      // ruin the report for no privacy gain, so stack frames are never walked.
      const event: ScrubbableEvent = {
        exception: {
          values: [
            {
              value: 'Cannot read properties of null',
              stacktrace: {
                frames: [{ filename: 'main-ABC.js', lineno: 1, colno: 234567890 }],
              },
            },
          ],
        },
      };
      const scrubbed = scrubEvent(event);
      const frames = (scrubbed.exception?.values?.[0]['stacktrace'] as { frames: unknown[] })
        .frames;
      expect(frames).toEqual([{ filename: 'main-ABC.js', lineno: 1, colno: 234567890 }]);
    });

    it('leaves an ordinary error message readable', () => {
      const scrubbed = scrubEvent({
        exception: { values: [{ value: 'Cannot read properties of null' }] },
      });
      expect(scrubbed.exception?.values?.[0].value).toBe('Cannot read properties of null');
    });

    it('leaves the SDK and release metadata alone', () => {
      const scrubbed = scrubEvent({
        sdk: { name: 'sentry.javascript.angular', version: '10.71.0' },
        release: '1.2.0',
      });
      expect(scrubbed['sdk']).toEqual({
        name: 'sentry.javascript.angular',
        version: '10.71.0',
      });
      expect(scrubbed['release']).toBe('1.2.0');
    });

    it('does not mutate the event it was given', () => {
      const event: ScrubbableEvent = { extra: { email: 'maria@example.com' } };
      scrubEvent(event);
      expect((event['extra'] as Record<string, unknown>)['email']).toBe('maria@example.com');
    });
  });

  describe('robustness', () => {
    it('survives an event with nothing in it', () => {
      expect(() => scrubEvent({})).not.toThrow();
    });

    it('survives null and non-object values in the containers', () => {
      const scrubbed = scrubEvent({ extra: { a: null, b: 42, c: true, d: undefined } });
      expect(scrubbed['extra']).toEqual({ a: null, b: 42, c: true, d: undefined });
    });

    it('scrubs inside arrays', () => {
      const out = json({ extra: { history: [{ email: 'maria@example.com' }] } });
      expect(out).not.toContain('maria@example.com');
    });

    it('stops rather than hanging on pathological nesting', () => {
      let deep: Record<string, unknown> = { email: 'maria@example.com' };
      for (let i = 0; i < 50; i += 1) {
        deep = { nested: deep };
      }
      const out = json({ extra: deep });
      expect(out).not.toContain('maria@example.com');
    });

    it('does not choke on a breadcrumb list containing non-objects', () => {
      expect(() => scrubEvent({ breadcrumbs: ['a string', null, 42] })).not.toThrow();
    });
  });
});
