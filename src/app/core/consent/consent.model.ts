/**
 * The consent vocabulary, kept free of Angular so it can be unit tested
 * directly and reused by anything that needs to reason about a stored decision.
 */

/**
 * Every purpose the site can store or transmit data for.
 *
 * `necessary` covers what the site cannot work without -- currently only the
 * locale cookie and the consent record itself. It is never presented as a
 * choice, because offering a toggle that does nothing is worse than offering
 * none.
 */
export const CONSENT_CATEGORIES = ['necessary', 'analytics', 'monitoring'] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

/**
 * The categories a visitor actually decides about. Everything the banner
 * renders as a toggle comes from this list, so adding a purpose here is the
 * single edit that puts it in front of the user.
 *
 * **hCaptcha is not going here.** Nelson's decision, and 4B T7 and 4C T5 both
 * raise it: neither the contact form nor the quote tool can operate safely
 * without spam protection, so it counts as strictly necessary for a service the
 * visitor has themselves asked for. Behind an opt-in it would produce a form
 * that cannot be submitted until cookies are accepted, which serves nobody --
 * least of all the visitor who declines and then cannot make an enquiry.
 *
 * Note what adding a category costs, before anyone adds one: CONSENT_VERSION
 * has to be bumped with it, and that re-prompts every visitor who has already
 * decided. Consent to three purposes is not consent to a fourth.
 */
export const OPTIONAL_CATEGORIES = ['analytics', 'monitoring'] as const;

export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number];

export type ConsentState = Readonly<Record<ConsentCategory, boolean>>;

/**
 * The state before any choice is made, and the state a rejection produces.
 *
 * Under AEPD guidance continuing to browse is not consent and a pre-ticked box
 * is not consent, so every optional category starts false. This constant is the
 * only place that default lives.
 */
export const DENY_ALL: ConsentState = Object.freeze({
  necessary: true,
  analytics: false,
  monitoring: false,
});

export const ALLOW_ALL: ConsentState = Object.freeze({
  necessary: true,
  analytics: true,
  monitoring: true,
});

/**
 * Bumping this invalidates every stored decision and re-prompts everyone.
 *
 * Required whenever a new purpose is added: consent given to two categories is
 * not consent to a third, and silently inheriting the old record would be
 * exactly the "consent by omission" the rules forbid.
 */
export const CONSENT_VERSION = 1;

/** The version is in the key so an old record is not merely ignored but unread. */
export const CONSENT_STORAGE_KEY = `hb_consent_v${CONSENT_VERSION}`;

export interface ConsentDecision {
  readonly version: number;
  /** ISO 8601. Proof of when consent was given is part of the record. */
  readonly decidedAt: string;
  readonly categories: ConsentState;
}

/**
 * Builds a decision from a partial set of choices, forcing `necessary` on and
 * defaulting anything unmentioned to denied.
 */
export function decide(
  choices: Partial<Record<OptionalCategory, boolean>>,
  decidedAt: string,
): ConsentDecision {
  const categories: ConsentState = {
    necessary: true,
    analytics: choices.analytics ?? false,
    monitoring: choices.monitoring ?? false,
  };
  return { version: CONSENT_VERSION, decidedAt, categories };
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Validates anything read back out of storage.
 *
 * localStorage is writable by the user, by another script, and by an older
 * build of this site. A record that does not match the current shape is treated
 * as no record at all -- which re-prompts -- rather than being coerced, because
 * a half-understood decision is not a decision.
 */
export function parseDecision(raw: string | null): ConsentDecision | null {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  if (candidate['version'] !== CONSENT_VERSION || typeof candidate['decidedAt'] !== 'string') {
    return null;
  }

  const categories = candidate['categories'];
  if (typeof categories !== 'object' || categories === null) {
    return null;
  }

  const values = categories as Record<string, unknown>;
  if (!CONSENT_CATEGORIES.every((category) => isBoolean(values[category]))) {
    return null;
  }

  // `necessary` is not the visitor's to switch off. A stored false means a
  // tampered or corrupt record, so it is rejected rather than honoured.
  if (values['necessary'] !== true) {
    return null;
  }

  return {
    version: CONSENT_VERSION,
    decidedAt: candidate['decidedAt'],
    categories: {
      necessary: true,
      analytics: values['analytics'] === true,
      monitoring: values['monitoring'] === true,
    },
  };
}
