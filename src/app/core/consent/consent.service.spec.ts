import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './consent.model';
import { ConsentService } from './consent.service';

function serviceWith(providers: unknown[] = []): ConsentService {
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.inject(ConsentService);
}

describe('ConsentService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('before any choice', () => {
    it('reports no decision, which is what shows the banner', () => {
      expect(serviceWith().hasDecided()).toBe(false);
    });

    it('denies every optional category', () => {
      const consent = serviceWith();
      expect(consent.allows('analytics')).toBe(false);
      expect(consent.allows('monitoring')).toBe(false);
    });

    it('still allows the necessary category', () => {
      expect(serviceWith().allows('necessary')).toBe(true);
    });

    it('has no decision timestamp', () => {
      expect(serviceWith().decidedAt()).toBeNull();
    });
  });

  describe('accepting', () => {
    it('grants every category', () => {
      const consent = serviceWith();
      consent.acceptAll();
      expect(consent.allows('analytics')).toBe(true);
      expect(consent.allows('monitoring')).toBe(true);
    });

    it('persists, so the banner does not return on the next visit', () => {
      serviceWith().acceptAll();
      TestBed.resetTestingModule();
      expect(serviceWith().allows('analytics')).toBe(true);
    });

    it('records when the choice was made', () => {
      const consent = serviceWith();
      consent.acceptAll();
      expect(consent.decidedAt()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('rejecting', () => {
    it('denies every optional category', () => {
      const consent = serviceWith();
      consent.rejectAll();
      expect(consent.allows('analytics')).toBe(false);
      expect(consent.allows('monitoring')).toBe(false);
    });

    it('is recorded as a decision, so the banner stops asking', () => {
      // A banner that reappears on every load for anyone who declined is
      // nagging, and nagging is itself a documented dark pattern.
      const consent = serviceWith();
      consent.rejectAll();
      expect(consent.hasDecided()).toBe(true);

      TestBed.resetTestingModule();
      const returning = serviceWith();
      expect(returning.hasDecided()).toBe(true);
      expect(returning.allows('analytics')).toBe(false);
    });
  });

  describe('per-category selection', () => {
    it('honours a partial grant', () => {
      const consent = serviceWith();
      consent.save({ analytics: true });
      expect(consent.allows('analytics')).toBe(true);
      expect(consent.allows('monitoring')).toBe(false);
    });

    it('survives a reload', () => {
      serviceWith().save({ monitoring: true });
      TestBed.resetTestingModule();
      const returning = serviceWith();
      expect(returning.allows('monitoring')).toBe(true);
      expect(returning.allows('analytics')).toBe(false);
    });
  });

  describe('withdrawing', () => {
    it('clears the decision and re-prompts', () => {
      const consent = serviceWith();
      consent.acceptAll();
      consent.withdraw();
      expect(consent.hasDecided()).toBe(false);
      expect(consent.allows('analytics')).toBe(false);
    });

    it('erases the stored record rather than storing a rejection', () => {
      const consent = serviceWith();
      consent.acceptAll();
      consent.withdraw();
      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });
  });

  describe('a stored record from an older consent version', () => {
    it('re-prompts rather than inheriting the old grant', () => {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          version: CONSENT_VERSION - 1,
          decidedAt: '2026-01-01T00:00:00.000Z',
          categories: { necessary: true, analytics: true, monitoring: true },
        }),
      );
      const consent = serviceWith();
      expect(consent.hasDecided()).toBe(false);
      expect(consent.allows('analytics')).toBe(false);
    });
  });

  describe('a corrupt stored record', () => {
    it('re-prompts rather than throwing', () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'not json at all');
      const consent = serviceWith();
      expect(consent.hasDecided()).toBe(false);
    });
  });

  describe('during prerendering', () => {
    it('denies everything optional, since no browser storage exists', () => {
      const consent = serviceWith([{ provide: PLATFORM_ID, useValue: 'server' }]);
      expect(consent.hasDecided()).toBe(false);
      expect(consent.allows('analytics')).toBe(false);
    });

    it('does not touch storage when a choice is made', () => {
      const consent = serviceWith([{ provide: PLATFORM_ID, useValue: 'server' }]);
      consent.acceptAll();
      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });

    it('reads back a decision it could not persist, for this render only', () => {
      const consent = serviceWith([{ provide: PLATFORM_ID, useValue: 'server' }]);
      consent.acceptAll();
      expect(consent.allows('analytics')).toBe(true);
    });
  });

  describe('when storage throws', () => {
    it('treats a blocked reader as undecided rather than failing to boot', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      expect(serviceWith().hasDecided()).toBe(false);
      getItem.mockRestore();
    });

    it('keeps the choice for this page when the write is refused', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });
      const consent = serviceWith();
      expect(() => consent.acceptAll()).not.toThrow();
      expect(consent.allows('analytics')).toBe(true);
      setItem.mockRestore();
    });

    it('does not throw when withdrawing against refused storage', () => {
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      const consent = serviceWith();
      expect(() => consent.withdraw()).not.toThrow();
      removeItem.mockRestore();
    });
  });
});
