import type { SupportedLocale } from '../i18n/negotiate-locale';

/**
 * The client's contact channels, framework-free.
 *
 * Shared by the site config and the contact function. The acknowledgement
 * email offers WhatsApp as the fast lane, and a second copy of these numbers
 * there is how the email ends up pointing at a number the site stopped using.
 */

/** The client's WhatsApp numbers, one per language, digits only. */
export const PHONE_DIGITS: Record<SupportedLocale, string> = {
  es: '+34677871861',
  en: '+34677873589',
};

/** The same numbers grouped for display, as the client writes them. */
export const PHONE_DISPLAY: Record<SupportedLocale, string> = {
  es: '+34 677 87 18 61',
  en: '+34 677 87 35 89',
};

/** wa.me rejects the leading +, so it is dropped here rather than at each caller. */
export function whatsappUrl(locale: SupportedLocale): string {
  return `https://wa.me/${PHONE_DIGITS[locale].replace('+', '')}`;
}
