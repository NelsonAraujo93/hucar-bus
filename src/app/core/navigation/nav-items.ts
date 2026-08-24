/**
 * The page's anchor sections, in DOM order.
 *
 * The ids stay Spanish in both locales. Translating fragment identifiers would
 * break links shared between locales -- /en/#servicios would not resolve if the
 * English build used #services -- for no SEO benefit, since fragments are not
 * indexed separately.
 */
export const NAV_IDS = ['servicios', 'nosotros', 'opiniones', 'instagram', 'contacto'] as const;

export type NavId = (typeof NAV_IDS)[number];

/** Includes the hero, which is a scroll-spy target but not a nav link. */
export const SPY_IDS = ['top', ...NAV_IDS] as const;

export interface NavItem {
  readonly id: NavId;
  readonly label: string;
}

/**
 * Labels are $localize-tagged here rather than in the template because
 * ng extract-i18n does not see plain string literals in TypeScript. Explicit
 * @@ ids keep translations attached when the source text is edited.
 */
export function navItems(): readonly NavItem[] {
  return [
    { id: 'servicios', label: $localize`:Navigation link|@@nav.servicios:Servicios` },
    { id: 'nosotros', label: $localize`:Navigation link|@@nav.nosotros:Sobre Nosotros` },
    { id: 'opiniones', label: $localize`:Navigation link|@@nav.opiniones:Opiniones` },
    { id: 'instagram', label: $localize`:Navigation link|@@nav.instagram:Instagram` },
    { id: 'contacto', label: $localize`:Navigation link|@@nav.contacto:Contacto` },
  ];
}
