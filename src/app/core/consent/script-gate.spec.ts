import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CONSENT_STORAGE_KEY } from './consent.model';
import { ConsentService } from './consent.service';
import { ScriptGate } from './script-gate';

interface Harness {
  readonly gate: ScriptGate;
  readonly consent: ConsentService;
  /** Effects are scheduled, not synchronous, so every assertion follows a flush. */
  flush(): void;
}

function harness(providers: unknown[] = []): Harness {
  TestBed.configureTestingModule({ providers: providers as never[] });
  return {
    gate: TestBed.inject(ScriptGate),
    consent: TestBed.inject(ConsentService),
    flush: () => TestBed.tick(),
  };
}

function scriptTags(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll('script[id^="test-"]'));
}

describe('ScriptGate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    for (const tag of scriptTags()) {
      tag.remove();
    }
  });

  it('does not activate while the category is denied', () => {
    const { gate, flush } = harness();
    let ran = false;
    gate.when('test-a', 'analytics', () => (ran = true));
    flush();
    expect(ran).toBe(false);
    expect(gate.hasActivated('test-a')).toBe(false);
  });

  it('does not activate merely because a different category was granted', () => {
    const { gate, consent, flush } = harness();
    let ran = false;
    gate.when('test-a', 'analytics', () => (ran = true));
    consent.save({ monitoring: true });
    flush();
    expect(ran).toBe(false);
  });

  it('activates as soon as the category is granted', () => {
    const { gate, consent, flush } = harness();
    let ran = false;
    gate.when('test-a', 'analytics', () => (ran = true));
    flush();
    consent.acceptAll();
    flush();
    expect(ran).toBe(true);
    expect(gate.hasActivated('test-a')).toBe(true);
  });

  it('activates immediately when consent already exists', () => {
    const { gate, consent, flush } = harness();
    consent.acceptAll();
    let ran = false;
    gate.when('test-a', 'analytics', () => (ran = true));
    flush();
    expect(ran).toBe(true);
  });

  it('runs exactly once, however often consent changes', () => {
    const { gate, consent, flush } = harness();
    let runs = 0;
    gate.when('test-a', 'analytics', () => (runs += 1));
    consent.acceptAll();
    flush();
    consent.withdraw();
    flush();
    consent.acceptAll();
    flush();
    expect(runs).toBe(1);
  });

  it('ignores a second registration under the same id', () => {
    const { gate, consent, flush } = harness();
    let runs = 0;
    consent.acceptAll();
    gate.when('test-a', 'analytics', () => (runs += 1));
    flush();
    gate.when('test-a', 'analytics', () => (runs += 1));
    flush();
    expect(runs).toBe(1);
  });

  it('never activates during prerendering, whatever the stored state says', () => {
    // A vendor script baked into the static HTML runs before the visitor has
    // been asked anything at all.
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        decidedAt: '2026-08-28T10:00:00.000Z',
        categories: { necessary: true, analytics: true, monitoring: true },
      }),
    );
    const { gate, flush } = harness([{ provide: PLATFORM_ID, useValue: 'server' }]);
    let ran = false;
    gate.when('test-a', 'analytics', () => (ran = true));
    flush();
    expect(ran).toBe(false);
  });

  describe('load', () => {
    it('appends no script tag while the category is denied', () => {
      const { gate, flush } = harness();
      gate.load({ id: 'test-vendor', src: 'https://example.test/v.js', category: 'analytics' });
      flush();
      expect(scriptTags()).toHaveLength(0);
    });

    it('appends the script once consent is given', () => {
      const { gate, consent, flush } = harness();
      gate.load({ id: 'test-vendor', src: 'https://example.test/v.js', category: 'analytics' });
      consent.acceptAll();
      flush();
      const tags = scriptTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].src).toBe('https://example.test/v.js');
      expect(tags[0].async).toBe(true);
    });

    it('carries the vendor data-* attributes across', () => {
      const { gate, consent, flush } = harness();
      consent.acceptAll();
      gate.load({
        id: 'test-vendor',
        src: 'https://example.test/v.js',
        category: 'analytics',
        attributes: { 'data-site': 'hucarbus' },
      });
      flush();
      expect(scriptTags()[0].getAttribute('data-site')).toBe('hucarbus');
    });

    it('does not append the same script twice', () => {
      const { gate, consent, flush } = harness();
      consent.acceptAll();
      const script = {
        id: 'test-vendor',
        src: 'https://example.test/v.js',
        category: 'analytics',
      } as const;
      gate.load(script);
      flush();
      gate.load(script);
      flush();
      expect(scriptTags()).toHaveLength(1);
    });
  });
});
