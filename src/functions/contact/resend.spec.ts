import { createResendSender, type OutgoingEmail } from './resend';

const EMAIL: OutgoingEmail = {
  from: 'Hucar Bus <hola@hucarbus.com>',
  to: 'inbox@example.com',
  replyTo: 'maria@example.com',
  subject: '[Cliente] Hola',
  text: 'texto',
  html: '<p>texto</p>',
};

describe('createResendSender', () => {
  it('posts the email to Resend with the key as a bearer token', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => Response.json({ id: 'msg_1' }));

    const result = await createResendSender('re_test', fetchFn)(EMAIL);

    expect(result).toEqual({ ok: true, id: 'msg_1' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['authorization']).toBe('Bearer re_test');
    expect(JSON.parse(init?.body as string)).toEqual({
      from: 'Hucar Bus <hola@hucarbus.com>',
      to: ['inbox@example.com'],
      reply_to: 'maria@example.com',
      subject: '[Cliente] Hola',
      text: 'texto',
      html: '<p>texto</p>',
    });
  });

  it('reports a rejected request with its status', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('{}', { status: 403 }));
    expect(await createResendSender('re_test', fetchFn)(EMAIL)).toEqual({ ok: false, status: 403 });
  });

  it('reports a network failure as status 0', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await createResendSender('re_test', fetchFn)(EMAIL)).toEqual({ ok: false, status: 0 });
  });

  it('still counts a success whose body is unreadable', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('not json', { status: 200 }));
    expect(await createResendSender('re_test', fetchFn)(EMAIL)).toEqual({ ok: true, id: '' });
  });

  it('uses the global fetch when none is given', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id: 'msg_2' }));
    try {
      expect(await createResendSender('re_test')(EMAIL)).toEqual({ ok: true, id: 'msg_2' });
    } finally {
      spy.mockRestore();
    }
  });
});
