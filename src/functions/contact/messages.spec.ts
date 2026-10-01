import type { ContactEnquiry } from '../../app/domain/contact/enquiry';
import { acknowledgementEmail, escapeHtml, notificationEmail } from './messages';

const ADDRESSES = { from: 'hola@hucarbus.com', inbox: 'inbox@example.com' };

function enquiry(overrides: Partial<ContactEnquiry> = {}): ContactEnquiry {
  return {
    name: 'María Hernández',
    email: 'maria@example.com',
    enquiryType: 'customer',
    subject: 'Traslado al aeropuerto',
    message: 'Somos cuatro.\nLlegamos el martes.',
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('escapes every character that can open markup or break an attribute', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
});

describe('notificationEmail', () => {
  it('goes to the inbox with Reply-To set to the enquirer', () => {
    const email = notificationEmail(enquiry(), 'es', ADDRESSES);

    expect(email.to).toBe('inbox@example.com');
    expect(email.from).toBe('Hucar Bus Web <hola@hucarbus.com>');
    expect(email.replyTo).toBe('maria@example.com');
  });

  it.each([
    ['customer', '[Cliente]'],
    ['operator', '[Operador]'],
    ['other', '[Otro]'],
  ] as const)('prefixes a %s subject with %s', (enquiryType, prefix) => {
    const email = notificationEmail(enquiry({ enquiryType }), 'es', ADDRESSES);
    expect(email.subject).toBe(`${prefix} Traslado al aeropuerto`);
  });

  it('keeps the subject on one line', () => {
    const email = notificationEmail(enquiry({ subject: 'Hola\r\nBcc: x@y.z' }), 'es', ADDRESSES);
    expect(email.subject).toBe('[Cliente] Hola Bcc: x@y.z');
  });

  it('includes optional fields only when present', () => {
    const bare = notificationEmail(enquiry(), 'es', ADDRESSES);
    expect(bare.text).not.toContain('Teléfono');
    expect(bare.text).not.toContain('Empresa');

    const full = notificationEmail(
      enquiry({ enquiryType: 'operator', phone: '+34 600 111 222', company: 'Island Tours' }),
      'en',
      ADDRESSES,
    );
    expect(full.text).toContain('Teléfono: +34 600 111 222');
    expect(full.text).toContain('Empresa: Island Tours');
  });

  it('records which language the enquiry came from', () => {
    expect(notificationEmail(enquiry(), 'es', ADDRESSES).text).toContain('Web: Español');
    expect(notificationEmail(enquiry(), 'en', ADDRESSES).text).toContain('Web: Inglés');
  });

  it('carries the message verbatim in the text part', () => {
    expect(notificationEmail(enquiry(), 'es', ADDRESSES).text).toContain(
      'Somos cuatro.\nLlegamos el martes.',
    );
  });

  it('escapes visitor input in the HTML part', () => {
    const email = notificationEmail(
      enquiry({ name: '<script>alert(1)</script>', message: '<img src=x onerror=y>' }),
      'es',
      ADDRESSES,
    );

    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<img');
    expect(email.html).toContain('&lt;script&gt;');
  });
});

describe('acknowledgementEmail', () => {
  it('goes to the enquirer, with replies routed to the inbox', () => {
    const email = acknowledgementEmail('maria@example.com', 'es', ADDRESSES);

    expect(email.to).toBe('maria@example.com');
    expect(email.from).toBe('Hucar Bus <hola@hucarbus.com>');
    expect(email.replyTo).toBe('inbox@example.com');
  });

  it('promises the date, price and payment link in Spanish', () => {
    const email = acknowledgementEmail('maria@example.com', 'es', ADDRESSES);

    expect(email.subject).toBe('Hemos recibido tu consulta · Hucar Bus');
    expect(email.text).toContain('la fecha, el precio y un enlace de pago seguro');
    expect(email.text).toContain('+34 677 87 18 61');
    expect(email.html).toContain('href="https://wa.me/34677871861"');
  });

  it('promises the same in English, with the English line', () => {
    const email = acknowledgementEmail('maria@example.com', 'en', ADDRESSES);

    expect(email.subject).toBe("We've received your enquiry · Hucar Bus");
    expect(email.text).toContain('the date, the price and a secure payment link');
    expect(email.text).toContain('+34 677 87 35 89');
    expect(email.html).toContain('href="https://wa.me/34677873589"');
  });

  it('is identical whoever it goes to, so it cannot carry anyone else’s text', () => {
    const a = acknowledgementEmail('a@example.com', 'es', ADDRESSES);
    const b = acknowledgementEmail('b@example.com', 'es', ADDRESSES);

    expect({ ...a, to: '' }).toEqual({ ...b, to: '' });
  });
});
