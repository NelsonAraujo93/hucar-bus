import { inject, InjectionToken, LOCALE_ID } from '@angular/core';
import {
  FALLBACK_LOCALE,
  toSupportedLocale,
  type SupportedLocale,
} from '../../../shared/i18n/negotiate-locale';

/**
 * The registered address, kept structured rather than as one string.
 *
 * The aviso legal, the privacy policy's responsable block and the LocalBusiness
 * JSON-LD each want different parts of it, and splitting a formatted string back
 * apart is how a postcode ends up in the wrong field.
 */
export interface PostalAddress {
  readonly street: string;
  readonly postcode: string;
  readonly city: string;
  readonly province: string;
  /** ISO 3166-1 alpha-2. */
  readonly country: string;
}

/**
 * Every client-supplied value the site displays.
 *
 * Identity and contact data is now VERIFIED against the AEAT Tarjeta de
 * Identificación Fiscal and the client's own contact card. What remains
 * unverified is marked, and the two registry fields that Spanish law requires
 * but nobody has supplied are typed as nullable so a missing value is a state
 * the templates must handle rather than an empty string that renders as nothing.
 *
 * The source documents stay out of this repository. It is public, and the AEAT
 * card carries a Código Seguro de Verificación that retrieves the original from
 * the tax agency. Only the transcribed field values below belong in the codebase.
 */
export interface SiteConfig {
  /** VERIFIED. Razón social, as registered. */
  readonly legalName: string;
  /** VERIFIED. The name the business trades and markets under. */
  readonly tradingName: string;
  /** VERIFIED. NIF definitivo, 06/04/2026. */
  readonly nif: string;
  /** VERIFIED. Domicilio fiscal y social. */
  readonly address: PostalAddress;
  /** VERIFIED. Full postal address on one line. */
  readonly addressFull: string;
  /** VERIFIED. Short form for the footer and the About badge. */
  readonly addressShort: string;

  /**
   * VERIFIED, and locale-dependent. The client operates one number per language;
   * the design assumed a single one. Resolved per build from LOCALE_ID.
   */
  readonly phone: string;
  /** Digits only, so the tel: href dials. */
  readonly phoneHref: string;
  /** The same number as {@link phone}, as a WhatsApp deep link. */
  readonly whatsappUrl: string;

  /**
   * VERIFIED, and deliberately the Gmail address rather than a domain mailbox.
   *
   * Phase 4B's decision table settles this by implication: the contact form
   * delivers to this inbox because there is "no new mailbox to manage", so
   * info@hucarbus.com is not going to exist. Publishing it would publish an
   * address that bounces. Phase 4B still sends *from* hola@hucarbus.com, which
   * is a different concern -- that address never receives.
   */
  readonly email: string;

  /** PLACEHOLDER. The handle was referenced by the client but never supplied. */
  readonly instagramUrl: string;

  /**
   * UNVERIFIED. The S.L. received its NIF definitivo in 2026, so this is a claim
   * about the family's driving history and not about the company. The copy is
   * phrased to match -- "una familia al volante desde", never "empresa familiar
   * desde" -- and must not be reworded without confirming the real history.
   */
  readonly foundedYear: number;
  /** UNVERIFIED. Same claim as {@link foundedYear}, shown as a stat. */
  readonly yearsOfExperience: string;
  /** UNVERIFIED. Shown as a stat and as the contact section's opening hours. */
  readonly availability: string;

  /**
   * Registro Mercantil details. Required of a registered company by LSSI-CE
   * art. 10 and not yet supplied, so the aviso legal renders a marked gap
   * instead of an empty line.
   */
  readonly mercantileRegistry: string | null;
  /**
   * Autorización de transporte de viajeros (VD/VT). Passenger transport is a
   * regulated activity in Spain. Not yet supplied.
   */
  readonly transportAuthorisation: string | null;
}

/** The client's WhatsApp numbers, one per language, digits only. */
const PHONE_DIGITS: Record<SupportedLocale, string> = {
  es: '+34677871861',
  en: '+34677873589',
};

/** The same numbers grouped for display, as the client writes them. */
const PHONE_DISPLAY: Record<SupportedLocale, string> = {
  es: '+34 677 87 18 61',
  en: '+34 677 87 35 89',
};

const ADDRESS: PostalAddress = {
  street: 'Calle Veracruz, 27',
  postcode: '35500',
  city: 'Arrecife',
  province: 'Las Palmas',
  country: 'ES',
};

export const SITE_CONFIG = new InjectionToken<SiteConfig>('hb.siteConfig', {
  providedIn: 'root',
  factory: () => {
    // LOCALE_ID is fixed per build, so this resolves once at bootstrap. It can
    // be a full tag (en-GB) or a bare one, and in tests it is neither.
    const locale = toSupportedLocale(inject(LOCALE_ID)) ?? FALLBACK_LOCALE;
    const digits = PHONE_DIGITS[locale];

    return {
      legalName: 'HUCAR BUS LANZAROTE TURISMO, S.L.',
      tradingName: 'Hucar Bus',
      nif: 'B26944884',
      address: ADDRESS,
      addressFull: `${ADDRESS.street}, ${ADDRESS.postcode} ${ADDRESS.city}, ${ADDRESS.province}`,
      addressShort: `${ADDRESS.city}, Lanzarote`,
      phone: PHONE_DISPLAY[locale],
      // wa.me rejects the leading +, tel: requires it.
      phoneHref: `tel:${digits}`,
      whatsappUrl: `https://wa.me/${digits.replace('+', '')}`,
      email: 'hucarbus@gmail.com',
      instagramUrl: 'https://instagram.com/hucarbus',
      foundedYear: 2014,
      yearsOfExperience: '10+',
      availability: '24/7',
      mercantileRegistry: null,
      transportAuthorisation: null,
    };
  },
});
