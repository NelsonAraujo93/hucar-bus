import { TestBed } from '@angular/core/testing';
import type { ContactSubmission } from '../../application/contact/contact-gateway';
import { FETCH, HttpContactGateway } from './http-contact-gateway';

const SUBMISSION: ContactSubmission = {
  enquiry: {
    name: 'Ana',
    email: 'ana@example.com',
    enquiryType: 'operator',
    company: 'Island Tours',
    subject: 'Colaboración',
    message: 'Hola',
  },
  locale: 'en',
  privacyAccepted: true,
  honeypot: '',
  elapsedMs: 7_000,
};

function setup(answer: () => Promise<Response>): {
  gateway: HttpContactGateway;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchFn = vi.fn<typeof fetch>(answer);
  TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetchFn }] });
  return { gateway: TestBed.inject(HttpContactGateway), fetchFn };
}

describe('HttpContactGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('posts the wire body to the endpoint, slash included', async () => {
    const { gateway, fetchFn } = setup(async () => Response.json({ ok: true }));

    await gateway.send(SUBMISSION);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/contact/');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      phone: '',
      enquiryType: 'operator',
      company: 'Island Tours',
      subject: 'Colaboración',
      message: 'Hola',
      privacyAccepted: true,
      locale: 'en',
      website: '',
      elapsedMs: 7_000,
    });
  });

  it('sends empty strings for the optional fields a customer leaves out', async () => {
    const { gateway, fetchFn } = setup(async () => Response.json({ ok: true }));

    await gateway.send({
      ...SUBMISSION,
      enquiry: { ...SUBMISSION.enquiry, enquiryType: 'customer', company: undefined },
    });

    const body = JSON.parse(fetchFn.mock.calls[0][1]?.body as string);
    expect(body.company).toBe('');
    expect(body.phone).toBe('');
  });

  it.each([
    ['success', async () => Response.json({ ok: true }), { status: 'sent' }],
    [
      'validation errors',
      async () =>
        Response.json(
          { ok: false, error: 'invalid', errors: [{ field: 'email', code: 'invalidEmail' }] },
          { status: 400 },
        ),
      { status: 'invalid', errors: [{ field: 'email', code: 'invalidEmail' }] },
    ],
    [
      'a rate limit',
      async () => Response.json({ ok: false, error: 'rate_limited' }, { status: 429 }),
      { status: 'rate_limited' },
    ],
    [
      'a delivery failure',
      async () => Response.json({ ok: false, error: 'unavailable' }, { status: 502 }),
      { status: 'unavailable' },
    ],
    [
      'a non-JSON answer',
      async () => new Response('<html>', { status: 200 }),
      { status: 'unavailable' },
    ],
    [
      'a 200 that does not say ok',
      async () => Response.json({ ok: false, error: 'bad_request' }),
      { status: 'unavailable' },
    ],
    [
      'a network failure',
      async () => {
        throw new TypeError('Failed to fetch');
      },
      { status: 'unavailable' },
    ],
  ] as const)('maps %s', async (_label, answer, expected) => {
    const { gateway } = setup(answer);
    expect(await gateway.send(SUBMISSION)).toEqual(expected);
  });

  it('defaults to the global fetch', () => {
    TestBed.configureTestingModule({});
    expect(typeof TestBed.inject(FETCH)).toBe('function');
  });
});
