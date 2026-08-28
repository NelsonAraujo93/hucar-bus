import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  decide,
  DENY_ALL,
  OPTIONAL_CATEGORIES,
  parseDecision,
} from './consent.model';

const DECIDED_AT = '2026-08-28T10:00:00.000Z';

function stored(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: CONSENT_VERSION,
    decidedAt: DECIDED_AT,
    categories: { necessary: true, analytics: true, monitoring: true },
    ...overrides,
  });
}

describe('consent model', () => {
  it('denies every optional category by default', () => {
    // Continuing to browse is not consent and a pre-ticked box is not consent.
    expect(DENY_ALL.necessary).toBe(true);
    for (const category of OPTIONAL_CATEGORIES) {
      expect(DENY_ALL[category]).toBe(false);
    }
  });

  it('puts the version in the storage key, so a bump cannot silently inherit', () => {
    expect(CONSENT_STORAGE_KEY).toBe(`hb_consent_v${CONSENT_VERSION}`);
  });

  describe('decide', () => {
    it('forces necessary on regardless of what it is handed', () => {
      expect(decide({}, DECIDED_AT).categories.necessary).toBe(true);
    });

    it('denies anything not explicitly granted', () => {
      const decision = decide({ analytics: true }, DECIDED_AT);
      expect(decision.categories.analytics).toBe(true);
      expect(decision.categories.monitoring).toBe(false);
    });

    it('records when the choice was made', () => {
      expect(decide({}, DECIDED_AT).decidedAt).toBe(DECIDED_AT);
    });
  });

  describe('parseDecision', () => {
    it('reads back a decision it wrote', () => {
      const decision = parseDecision(stored());
      expect(decision?.categories).toEqual({
        necessary: true,
        analytics: true,
        monitoring: true,
      });
      expect(decision?.decidedAt).toBe(DECIDED_AT);
    });

    it('treats a missing record as undecided', () => {
      expect(parseDecision(null)).toBeNull();
    });

    it('treats an older consent version as undecided, which re-prompts', () => {
      expect(parseDecision(stored({ version: CONSENT_VERSION - 1 }))).toBeNull();
    });

    it('treats a newer version as undecided too', () => {
      // A visitor who used a later build then went back to a cached older one.
      expect(parseDecision(stored({ version: CONSENT_VERSION + 1 }))).toBeNull();
    });

    it('rejects malformed JSON rather than throwing', () => {
      expect(parseDecision('{not json')).toBeNull();
    });

    it('rejects a record that is not an object', () => {
      expect(parseDecision('"a string"')).toBeNull();
      expect(parseDecision('null')).toBeNull();
      expect(parseDecision('42')).toBeNull();
    });

    it('rejects a record missing its categories', () => {
      expect(parseDecision(stored({ categories: undefined }))).toBeNull();
      expect(parseDecision(stored({ categories: null }))).toBeNull();
    });

    it('rejects a record with a non-boolean category', () => {
      expect(
        parseDecision(stored({ categories: { necessary: true, analytics: 'yes' } })),
      ).toBeNull();
    });

    it('rejects a record missing a category the current version defines', () => {
      // This is what a stale record from a build with fewer purposes looks like
      // if someone forgets to bump the version. It must re-prompt, not inherit.
      expect(
        parseDecision(stored({ categories: { necessary: true, analytics: true } })),
      ).toBeNull();
    });

    it('rejects a record claiming necessary was switched off', () => {
      // Not the visitor's to switch off, so a false means tampering or corruption.
      const raw = stored({
        categories: { necessary: false, analytics: false, monitoring: false },
      });
      expect(parseDecision(raw)).toBeNull();
    });

    it('rejects a decidedAt that is not a string', () => {
      expect(parseDecision(stored({ decidedAt: 1234 }))).toBeNull();
    });

    it('coerces nothing: a truthy non-true category reads as denied', () => {
      // Guarded by the boolean check above, but asserted so a future relaxation
      // of that check cannot quietly start honouring "1" as consent.
      expect(
        parseDecision(stored({ categories: { necessary: true, analytics: 1, monitoring: 1 } })),
      ).toBeNull();
    });
  });
});
