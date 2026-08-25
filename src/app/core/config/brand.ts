/**
 * Product and brand names that appear as visible labels.
 *
 * Kept out of the translation files deliberately. They read identically in
 * every locale, and putting them in a message catalogue invites a translator to
 * "translate" WhatsApp. Interpolating them also keeps the template i18n rule
 * satisfied without inventing a unit nobody should ever change.
 */
export const BRAND = {
  whatsapp: 'WhatsApp',
} as const;
