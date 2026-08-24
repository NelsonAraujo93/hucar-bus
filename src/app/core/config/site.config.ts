import { InjectionToken } from '@angular/core';

/**
 * Every client-supplied value the site displays.
 *
 * All of these are placeholders from the design handoff and none has been
 * confirmed. They live here rather than in templates so correcting them is a
 * one-file change, and so it stays obvious how much of the site is unverified.
 *
 * Open questions this represents: the real phone, WhatsApp number, email and
 * address; whether the business really has operated since 2014; and whether the
 * rating and review count are real. The rating in particular must match whatever
 * the Reviews section eventually shows, so it is deliberately not duplicated.
 */
export interface SiteConfig {
  /** PLACEHOLDER. Display form. */
  readonly phone: string;
  /** PLACEHOLDER. tel: href, digits only. */
  readonly phoneHref: string;
  /** PLACEHOLDER. */
  readonly email: string;
  /** PLACEHOLDER. */
  readonly whatsappUrl: string;
  readonly instagramUrl: string;
  /** PLACEHOLDER. Full postal address. */
  readonly address: string;
  /** PLACEHOLDER. Short form for the footer and the About badge. */
  readonly addressShort: string;
  /** PLACEHOLDER. Unverified claim. */
  readonly foundedYear: number;
  /** PLACEHOLDER. Unverified claim, shown as a stat. */
  readonly yearsOfExperience: string;
  /** PLACEHOLDER. Unverified claim. */
  readonly availability: string;
  /** PLACEHOLDER. Unverified claim. Must match the Reviews section. */
  readonly rating: string;
}

export const SITE_CONFIG = new InjectionToken<SiteConfig>('hb.siteConfig', {
  providedIn: 'root',
  factory: () => ({
    phone: '+34 600 000 000',
    phoneHref: 'tel:+34600000000',
    email: 'info@hucarbus.com',
    whatsappUrl: 'https://wa.me/34600000000',
    instagramUrl: 'https://instagram.com/hucarbus',
    address: 'Arrecife, Lanzarote, 35500',
    addressShort: 'Arrecife, Lanzarote',
    foundedYear: 2014,
    yearsOfExperience: '10+',
    availability: '24/7',
    rating: '4.8★',
  }),
});
