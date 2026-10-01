import type { ContactEnquiry, EnquiryType } from '../../app/domain/contact/enquiry';
import type { SupportedLocale } from '../../shared/i18n/negotiate-locale';
import { PHONE_DISPLAY, whatsappUrl } from '../../shared/contact/channels.js';
import type { OutgoingEmail } from './resend.js';

/**
 * The two emails a submission produces.
 *
 * Kept apart from the handler so their wording can be read and tested without
 * a request, and so that changing copy never touches the order of operations.
 */

export interface Addresses {
  /** A verified sender on the Resend domain, e.g. `hola@hucarbus.com`. */
  readonly from: string;
  /** The client's inbox. */
  readonly inbox: string;
}

/**
 * Subject prefixes, in Spanish: they are read by the client, who works in
 * Spanish whichever site the enquiry came from.
 */
const TYPE_LABELS: Record<EnquiryType, string> = {
  customer: 'Cliente',
  operator: 'Operador',
  other: 'Otro',
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** A subject is one line. Anything else is either a mistake or an injection attempt. */
function oneLine(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, ' ');
}

/**
 * The enquiry, delivered to the client's inbox.
 *
 * Reply-To is the enquirer, so pressing Reply in Gmail answers them directly.
 */
export function notificationEmail(
  enquiry: ContactEnquiry,
  locale: SupportedLocale,
  addresses: Addresses,
): OutgoingEmail {
  const rows: [string, string][] = [
    ['Tipo', TYPE_LABELS[enquiry.enquiryType]],
    ['Nombre', enquiry.name],
    ['Email', enquiry.email],
    ...(enquiry.phone ? ([['Teléfono', enquiry.phone]] as [string, string][]) : []),
    ...(enquiry.company ? ([['Empresa', enquiry.company]] as [string, string][]) : []),
    ['Web', locale === 'es' ? 'Español' : 'Inglés'],
    ['Asunto', enquiry.subject],
  ];

  const text = [
    'Nueva consulta desde hucarbus.com',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Mensaje:',
    enquiry.message,
    '',
    '—',
    'Responde a este correo para contestar directamente a quien escribió.',
  ].join('\n');

  const html = [
    '<p><strong>Nueva consulta desde hucarbus.com</strong></p>',
    '<table cellpadding="4" style="border-collapse:collapse">',
    ...rows.map(
      ([label, value]) =>
        `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    ),
    '</table>',
    '<p><strong>Mensaje:</strong></p>',
    `<p style="white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>`,
    '<hr>',
    '<p style="color:#666">Responde a este correo para contestar directamente a quien escribió.</p>',
  ].join('\n');

  return {
    from: `Hucar Bus Web <${addresses.from}>`,
    to: addresses.inbox,
    replyTo: enquiry.email,
    subject: oneLine(`[${TYPE_LABELS[enquiry.enquiryType]}] ${enquiry.subject}`),
    text,
    html,
  };
}

interface AcknowledgementCopy {
  readonly subject: string;
  readonly greeting: string;
  readonly body: string;
  readonly whatsapp: string;
  readonly replyHint: string;
}

/**
 * Fixed copy, with no visitor input anywhere in it -- not even the name.
 *
 * This email goes to whatever address was typed into the form. If it echoed
 * the name, subject or message, anyone could make hucarbus.com send their own
 * text to any inbox, signed with this domain's DKIM. Fixed copy makes the form
 * useless as a spam relay; the rate limit caps how often it can be pointed at
 * one victim.
 */
const ACKNOWLEDGEMENT: Record<SupportedLocale, AcknowledgementCopy> = {
  es: {
    subject: 'Hemos recibido tu consulta · Hucar Bus',
    greeting: 'Hola:',
    body:
      'Gracias por escribir a Hucar Bus. Hemos recibido tu consulta y te responderemos ' +
      'en menos de 24 horas con la fecha, el precio y un enlace de pago seguro para ' +
      'confirmar tu servicio.',
    whatsapp: 'Si lo necesitas antes, escríbenos por WhatsApp:',
    replyHint: 'Puedes responder a este correo si quieres añadir algo.',
  },
  en: {
    subject: "We've received your enquiry · Hucar Bus",
    greeting: 'Hello,',
    body:
      "Thank you for contacting Hucar Bus. We've received your enquiry and will reply " +
      'within 24 hours with the date, the price and a secure payment link to confirm ' +
      'your booking.',
    whatsapp: 'If you need us sooner, message us on WhatsApp:',
    replyHint: 'You can reply to this email if you would like to add anything.',
  },
};

/** The receipt sent to the enquirer, in the language of the site they used. */
export function acknowledgementEmail(
  to: string,
  locale: SupportedLocale,
  addresses: Addresses,
): OutgoingEmail {
  const copy = ACKNOWLEDGEMENT[locale];
  const phone = PHONE_DISPLAY[locale];
  const link = whatsappUrl(locale);

  const text = [
    copy.greeting,
    '',
    copy.body,
    '',
    `${copy.whatsapp} ${phone} (${link})`,
    '',
    copy.replyHint,
    '',
    'Hucar Bus · Lanzarote',
  ].join('\n');

  const html = [
    `<p>${escapeHtml(copy.greeting)}</p>`,
    `<p>${escapeHtml(copy.body)}</p>`,
    `<p>${escapeHtml(copy.whatsapp)} <a href="${link}">${escapeHtml(phone)}</a></p>`,
    `<p>${escapeHtml(copy.replyHint)}</p>`,
    '<p>Hucar Bus · Lanzarote</p>',
  ].join('\n');

  return {
    from: `Hucar Bus <${addresses.from}>`,
    to,
    // Replies go to the client's inbox, never back to a no-reply void.
    replyTo: addresses.inbox,
    subject: copy.subject,
    text,
    html,
  };
}
