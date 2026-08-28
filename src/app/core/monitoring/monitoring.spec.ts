import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConsentService } from '../consent/consent.service';
import { ScriptGate } from '../consent/script-gate';
import { Monitoring, SENTRY_GATE_ID } from './monitoring';
import { MonitoringErrorHandler } from './monitoring-error-handler';
import { SENTRY_CONFIG, type SentryConfig } from './sentry.config';

const CONFIGURED: SentryConfig = {
  dsn: 'https://examplekey@o0.ingest.sentry.io/0',
  environment: 'production',
  release: null,
  tracesSampleRate: 0.1,
};

interface Harness {
  readonly monitoring: Monitoring;
  readonly consent: ConsentService;
  readonly gate: ScriptGate;
  flush(): void;
}

function harness(config: Partial<SentryConfig> = {}): Harness {
  TestBed.configureTestingModule({
    providers: [{ provide: SENTRY_CONFIG, useValue: { ...CONFIGURED, ...config } }],
  });
  return {
    monitoring: TestBed.inject(Monitoring),
    consent: TestBed.inject(ConsentService),
    gate: TestBed.inject(ScriptGate),
    flush: () => TestBed.tick(),
  };
}

describe('Monitoring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('consent gating', () => {
    it('does not load Sentry before a decision is made', () => {
      const { monitoring, gate, flush } = harness();
      monitoring.start();
      flush();
      expect(gate.hasActivated(SENTRY_GATE_ID)).toBe(false);
    });

    it('does not load Sentry when monitoring is refused', () => {
      const { monitoring, consent, gate, flush } = harness();
      monitoring.start();
      consent.rejectAll();
      flush();
      expect(gate.hasActivated(SENTRY_GATE_ID)).toBe(false);
    });

    it('does not load Sentry when only analytics is granted', () => {
      // Consent to one purpose is not consent to another.
      const { monitoring, consent, gate, flush } = harness();
      monitoring.start();
      consent.save({ analytics: true });
      flush();
      expect(gate.hasActivated(SENTRY_GATE_ID)).toBe(false);
    });

    it('loads Sentry once monitoring is granted', async () => {
      const { monitoring, consent, gate, flush } = harness();
      monitoring.start();
      consent.save({ monitoring: true });
      flush();
      expect(gate.hasActivated(SENTRY_GATE_ID)).toBe(true);
      await monitoring.whenReady();
    });
  });

  describe('when no DSN is configured', () => {
    it('never registers with the gate at all', () => {
      // The account does not exist yet. An unset DSN is a defined state, not an
      // accident, and it must not leave a live gate waiting to fire.
      const { monitoring, consent, gate, flush } = harness({ dsn: '' });
      monitoring.start();
      consent.acceptAll();
      flush();
      expect(gate.hasActivated(SENTRY_GATE_ID)).toBe(false);
    });

    it('reports nothing and throws nothing', () => {
      const { monitoring, consent, flush } = harness({ dsn: '' });
      monitoring.start();
      consent.acceptAll();
      flush();
      expect(() => monitoring.captureException(new Error('boom'))).not.toThrow();
    });
  });

  describe('captureException', () => {
    it('is silent while Sentry has not loaded', () => {
      const { monitoring } = harness();
      expect(() => monitoring.captureException(new Error('boom'))).not.toThrow();
    });
  });

  describe('MonitoringErrorHandler', () => {
    it('forwards to monitoring and still delegates to the base handler', () => {
      // Losing the console to gain remote reporting would be a poor trade.
      TestBed.configureTestingModule({
        providers: [
          { provide: SENTRY_CONFIG, useValue: CONFIGURED },
          { provide: ErrorHandler, useClass: MonitoringErrorHandler },
        ],
      });
      const monitoring = TestBed.inject(Monitoring);
      const captured = vi.spyOn(monitoring, 'captureException');
      const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const error = new Error('boom');
      TestBed.inject(ErrorHandler).handleError(error);

      expect(captured).toHaveBeenCalledWith(error);
      expect(logged).toHaveBeenCalled();

      captured.mockRestore();
      logged.mockRestore();
    });
  });
});
